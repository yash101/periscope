#!/usr/bin/env swift

/**
  Simple UNIX-domain socket server that performs Apple Vision OCR and text summarization.
  Communicates via NDJSON over the socket.

  Just a note that this was vibe coded and probably needs to be hardened for production use.
  Should work tho :)
*/

import Foundation
import Darwin
import Vision
import ImageIO
import CoreGraphics

// Simple UNIX-domain socket action server in Swift.
// Usage: AppleIntelligenceServer.swift /path/to/socket.sock

enum ServerError: Error {
	case socketCreationFailed(Int32)
	case bindFailed(Int32)
	case listenFailed(Int32)
	case acceptFailed(Int32)
}

func log(_ items: Any...) {
	let msg = items.map { "\($0)" }.joined(separator: " ")
	FileHandle.standardError.write((msg + "\n").data(using: .utf8)!)
}

// Helper: Run POSIX socket create/bind/listen/accept
let args = CommandLine.arguments
let socketPath: String = {
	if args.count >= 2 {
		return args[1]
	} else {
		let home = NSHomeDirectory()
		return (home as NSString).appendingPathComponent(".periscope/apple_intel.sock")
	}
}()

// Ensure directory exists
do {
	let dir = (socketPath as NSString).deletingLastPathComponent
	try FileManager.default.createDirectory(atPath: dir, withIntermediateDirectories: true, attributes: nil)
} catch {
	log("Failed to create socket directory:", error)
}

// Remove existing socket file if present
if FileManager.default.fileExists(atPath: socketPath) {
	try? FileManager.default.removeItem(atPath: socketPath)
}

let fd = socket(AF_UNIX, SOCK_STREAM, 0)
guard fd >= 0 else {
	log("socket() failed")
	exit(1)
}

var addr = sockaddr_un()
let sunPathMax = MemoryLayout.size(ofValue: addr.sun_path)
addr.sun_family = sa_family_t(AF_UNIX)

// copy socketPath into sun_path
let pathData = socketPath.utf8CString
withUnsafeMutablePointer(to: &addr) { p in
	p.withMemoryRebound(to: UInt8.self, capacity: MemoryLayout<sockaddr_un>.size) { _ in
		// nothing
	}
}

_ = withUnsafeMutablePointer(to: &addr) { ptr -> Int32 in
	ptr.withMemoryRebound(to: sockaddr.self, capacity: 1) { sockaddrPtr in
		// fill sun_path
		let sunPathPtr = UnsafeMutableRawPointer(mutating: UnsafeRawPointer(ptr)).advanced(by: 2)
		// copy safely
		for (i, ch) in pathData.enumerated() where i < sunPathMax {
			sunPathPtr.advanced(by: i).storeBytes(of: ch, as: UInt8.self)
		}

		let len = socklen_t(MemoryLayout.size(ofValue: addr))
		return bind(fd, sockaddrPtr, len)
	}
}

// Set permissions to owner rw only
chmod(socketPath, S_IRUSR | S_IWUSR)

if listen(fd, 10) != 0 {
	log("listen() failed")
	exit(1)
}

log("AppleIntelligenceServer listening on \(socketPath)")

// Helper to read from client fd until closed; we parse NDJSON lines
func handleClient(clientFd: Int32) {
	let bufferSize = 16 * 1024
	var buffer = [UInt8](repeating: 0, count: bufferSize)
	var data = Data()

	while true {
		let n = read(clientFd, &buffer, bufferSize)
		if n > 0 {
			data.append(buffer, count: n)
			// process lines
			while true {
				if let range = data.firstRange(of: Data([0x0A])) { // newline
					let lineData = data.subdata(in: 0..<range.lowerBound)
					data.removeSubrange(0...range.lowerBound)
					processLine(lineData: lineData, clientFd: clientFd)
				} else {
					break
				}
			}
		} else if n == 0 {
			break // EOF
		} else {
			break
		}
	}
	close(clientFd)
}

func processLine(lineData: Data, clientFd: Int32) {
	guard let jsonObj = try? JSONSerialization.jsonObject(with: lineData, options: []),
		  let dict = jsonObj as? [String: Any],
		  let action = dict["action"] as? String else {
		let resp = ["ok": false, "error": "invalid json or missing action"] as [String: Any]
		sendResponse(resp, clientFd: clientFd)
		return
	}

	let id = dict["id"]
	let encoding = dict["encoding"] as? String
	let content = dict["content"] as? String
	let options = dict["options"] as? [String: Any]

	Task {
		do {
			let result: Any?
			switch action {
			case "echo":
				result = ["content": content ?? "", "encoding": encoding ?? "text"]
			case "summarize":
				if encoding == nil || encoding == "text" {
					let text = content ?? ""
					let maxSent = (options?["maxSentences"] as? Int) ?? 3
					result = summarizeText(text: text, maxSentences: maxSent)
				} else {
					throw NSError(domain: "ai", code: 1, userInfo: [NSLocalizedDescriptionKey: "summarize expects text encoding"])
				}
			case "ocr":
				if encoding == "base64", let b64 = content {
					let txt = try performOCR(base64: b64, options: options)
					result = txt
				} else {
					throw NSError(domain: "ai", code: 2, userInfo: [NSLocalizedDescriptionKey: "ocr expects base64 image content"])
				}
			default:
				throw NSError(domain: "ai", code: 3, userInfo: [NSLocalizedDescriptionKey: "unknown action"])
			}

			var resp: [String: Any] = ["ok": true, "result": result ?? NSNull()]
			if let id = id { resp["id"] = id }
			sendResponse(resp, clientFd: clientFd)
		} catch {
			var resp: [String: Any] = ["ok": false, "error": "\(error.localizedDescription)"]
			if let id = id { resp["id"] = id }
			sendResponse(resp, clientFd: clientFd)
		}
	}
}

func sendResponse(_ resp: [String: Any], clientFd: Int32) {
	guard let data = try? JSONSerialization.data(withJSONObject: resp, options: []) else { return }
	var out = data
	out.append(0x0A)
	_ = out.withUnsafeBytes { (ptr: UnsafeRawBufferPointer) in
		write(clientFd, ptr.baseAddress, out.count)
	}
}

func summarizeText(text: String, maxSentences: Int) -> String {
	// simple sentence split by punctuation
	let pattern = "[^.!?]+[.!?\\u2026]?"
	let regex = try? NSRegularExpression(pattern: pattern, options: [])
	let ns = text as NSString
	let matches = regex?.matches(in: text, options: [], range: NSRange(location: 0, length: ns.length)) ?? []
	let sentences = matches.map { ns.substring(with: $0.range).trimmingCharacters(in: .whitespacesAndNewlines) }
	if sentences.count <= maxSentences { return text.trimmingCharacters(in: .whitespacesAndNewlines) }
	return sentences.prefix(maxSentences).joined(separator: " ")
}

func performOCR(base64: String, options: [String: Any]?) throws -> String {
	guard let data = Data(base64Encoded: base64) else { throw NSError(domain: "ai", code: 4, userInfo: [NSLocalizedDescriptionKey: "invalid base64"]) }
	guard let imgSource = CGImageSourceCreateWithData(data as CFData, nil),
		  let cgImage = CGImageSourceCreateImageAtIndex(imgSource, 0, nil) else {
		throw NSError(domain: "ai", code: 5, userInfo: [NSLocalizedDescriptionKey: "could not create image from data"])
	}

	let request = VNRecognizeTextRequest()
	request.recognitionLevel = .accurate
	request.usesLanguageCorrection = true

	let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
	try handler.perform([request])

	let observations = request.results as? [VNRecognizedTextObservation] ?? []
	let texts = observations.compactMap { $0.topCandidates(1).first?.string }
	return texts.joined(separator: "\n")
}

// Accept loop
while true {
	var clientAddr = sockaddr()
	var addrLen: socklen_t = socklen_t(MemoryLayout<sockaddr>.size)
	let clientFd = accept(fd, &clientAddr, &addrLen)
	if clientFd < 0 {
		log("accept failed")
		continue
	}

	// handle client on background queue
	DispatchQueue.global().async {
		handleClient(clientFd: clientFd)
	}
}
