# Apple Intelligence Daemon

This directory contains the source code for the Apple Intelligence Daemon.

Goals of this module:
* Cheap, efficient, offline AI inference on supported Apple devices
* Seamless integration with macOS and iOS system services
* Privacy-preserving by design, with all processing done locally on device
* Support for on-device model updates via Apple's private APIs
* Low power consumption / efficient use of system resources

Features:
* Summarize text and non-text content using on-device LLMs
* Generate context-aware suggestions for user actions
* OCR (optical character recognition) for images and screenshots

## Issues

* Periscope integration pending
* Need to figure out how to build, sign, notarize and distribute binaries or source code to devices
* Need to integrate with Periscope's update mechanism to deliver updates to the daemon
