# ProgImage

**ProgImage** is a programmatic image storage and processing service designed for use by other applications via an API. It allows bulk image uploads and operates at scale while offering seamless image retrieval in multiple formats.

---

## Table of Contents

1. [Features](#features)
2. [Architecture Overview](#architecture-overview)
3. [Installation](#installation)
4. [API Endpoints](#api-endpoints)
5. [Image Processing and Format Conversion](#image-processing-and-format-conversion)
6. [Scalability and Future Considerations](#scalability-and-future-considerations)
7. [Testing](#testing)
8. [Limitations](#limitations)
9. [Next Steps](#next-steps)

---

## Features

- **Image Upload**: Upload multiple images at once, each receiving a unique identifier.
- **Image Retrieval**: Retrieve images by their unique identifier, with optional format conversion (e.g., JPEG to PNG).
- **Supported Image Formats**: JPEG, PNG, WebP, TIFF, and GIF.
- **Bulk Upload**: Upload up to 10 images in a single request.
- **Automated Tests**: Tests for image upload, retrieval, and format conversion.

---

## Architecture Overview

ProgImage is built using **Node.js**, **Nest.js**, and **TypeScript**, providing a clean, modular structure for scalability and maintainability. It leverages the **sharp** library for image manipulation and storage is handled locally in this version, with the capability to easily extend to cloud storage (such as AWS S3 or Google Cloud Storage) for production use.

### Key Technologies:

- **Node.js**: Fast, asynchronous runtime for building scalable services.
- **Nest.js**: A progressive Node.js framework offering modular organization and strong TypeScript support.
- **TypeScript**: Ensures type safety and better developer experience.
- **Sharp**: High-performance image processing library for fast transformations.
- **Multer**: Middleware for handling image uploads.

---

## Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/webtaculars-ai/ProgImage.git
   cd progimage `

   ```

1. **Install dependencies**:

   ```bash
   npm install

   ```

1. **Set up configuration**:

   - Copy `.env.example` to `.env` and modify as necessary.
   - By default, images will be stored locally in the `storage` folder.

1. **Run the application**:

   ```bash
   npm run start

   ```

1. **Run tests**:

   ```bash
   npm run test
   ```

---

## API Endpoints

### Upload Images

- **Endpoint**: `POST /images/upload`
- **Description**: Upload multiple images (up to 10). Each image receives a unique ID.
- **Request**:
  - `multipart/form-data` with `files[]` as the key.
- **Response**: Array of objects with each image's unique identifier.

  ```json
  [{ "id": "generated-unique-id-1" }, { "id": "generated-unique-id-2" }]
  ```

### Retrieve Image with Optional Format Conversion

- **Endpoint**: `GET /images/:id.:format?`
- **Description**: Retrieve an image by ID with optional format conversion.
- **Request**:
  - `id`: The unique identifier of the image.
  - `format`: Optional image format (e.g., `png`, `webp`, `tiff`).
- **Response**: Image file in the requested format.
  - If no format is specified, the original format is returned.
  - Supported formats: `jpeg`, `png`, `webp`, `tiff`, `gif`.

---

## Image Processing and Format Conversion

ProgImage leverages **sharp** for high-performance image format conversion. If a format is specified during image retrieval (e.g., `/images/:id.png`), the service converts the image to the desired format before responding.

Supported formats:

- JPEG
- PNG
- WebP
- TIFF
- GIF

---

## Scalability and Future Considerations

### Scalability

Currently, images are stored locally on the server. For production, storage could be expanded to use cloud services like **S3**, **GCS**, or **Azure Blob Storage**.

### Performance Optimizations

- **Bulk processing**: Image uploads and conversions can be processed asynchronously using **RabbitMQ** for better performance at scale.
- **Caching**: Adding caching layers with Redis can improve retrieval times for frequently accessed images and reduce conversion load.
- **Concurrency**: Managing file processing concurrency will ensure the service remains performant under high traffic.

### API Rate Limiting

To handle large-scale use cases, introducing rate-limiting and monitoring tools like **Prometheus** could be future enhancements.

---

## Testing

ProgImage includes a set of automated tests to validate the key functionalities:

- **Image Upload**: Ensures that multiple images can be uploaded and assigned unique IDs.
- **Image Retrieval**: Validates that uploaded images can be retrieved by their ID.
- **Format Conversion**: Tests that images are correctly converted into requested formats (e.g., JPEG to PNG).
- **Edge Cases**: Tests that invalid or unsupported formats are properly handled with meaningful errors.
- **Large image and concurrent uploads**: Large image uploads and concurrent uploads to validate the system’s ability to handle multiple images at once.

To run tests:

```bash
npm run test
```

---

## Limitations

- **Not production-ready**: This version stores images locally and does not handle deployment concerns like security, error handling, or scaling to multiple servers.
- **Limited error handling**: Error handling is basic, and input validation is minimal, as per the task's out-of-scope requirements.

---

## Next Steps for Production

### 1\. **Cloud Storage**:

- Integrate cloud storage services like AWS S3 for scalable storage solutions.

### 2\. **Background Workers**:

- Introduce background workers for asynchronous bulk processing of images, which would allow the service to handle more concurrent requests efficiently.

### 3\. **Caching**:

- Implement a caching layer for frequently accessed images.

### 4\. **Monitoring and Metrics**:

- Add monitoring tools such as **Datadog** to track image processing times, request throughput, and potential bottlenecks.

### 5\. **Rate Limiting**:

- Implement rate-limiting to safeguard the service against abusive usage and ensure stability under high loads.

### 6\. **Security checks**:

- Implement virus scanning for uploaded files to enhance security.

---

## Conclusion

ProgImage demonstrates a foundational image storage and processing service with flexible format conversion capabilities. While this version is not production-ready, it is designed with future scalability in mind, and further improvements can be easily integrated into the architecture.
