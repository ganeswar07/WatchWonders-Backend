

# WatchWonders-Backend

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE.md)

> Backend component for the WatchWonders project - A video hosting website in active development.



## Overview

**WatchWonders-Backend** serves as the backend component for the WatchWonders project, a complete video hosting website similar to YouTube. The project is currently undergoing active development and aims to provide features such as user authentication, video uploading, user interactions (like, dislike, comment, reply), and subscription management.

## Project Status

**This project is currently in the early stages of development.Please check back for updates as we continue to build and improve the features.**

## Table of Contents

1. [Installation](#installation)
2. [Usage](#usage)
3. [Technologies Used](#technologies-used)
4. [Project Structure](#project-structure)
5. [User Router](#user-router)
6. [Contributing](#contributing)
7. [License](#license)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/ganeswar07/WatchWonders-Backend.git
   ```

2. Install dependencies:

   ```bash
   cd WatchWonders-Backend
   npm install
   ```

3. Set up environment variables:

   Create a `.env` file in the root directory with the following content:

   ```env
   PORT=8000
   MONGODB_URI=your_mongodb_uri
   ACCESS_TOKEN_SECRET=your_access_token_secret
   REFRESH_TOKEN_SECRET=your_refresh_token_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   CORS_ORIGIN=http://localhost:3000
   ```

   Adjust the values according to your setup.

## Usage

Run the development server:

```bash
npm run dev
```

The server will be accessible at `http://localhost:8000`.

## Technologies Used

- **Node.js:** JavaScript runtime for server-side development.
- **Express:** Web application framework for Node.js.
- **MongoDB:** NoSQL database for storing application data.
- **Mongoose:** MongoDB object modeling tool designed for Node.js.
- **Multer:** Middleware for handling file uploads.
- **Cloudinary:** Cloud-based image and video management platform.
- **JSON Web Tokens (JWT):** JSON-based open standard for creating access tokens.
- **bcrypt:** Library for hashing passwords.


## Project Structure

- `controllers/`: Contains route handler functions.
- `middlewares/`: Holds middleware functions.
- `models/`: Defines Mongoose models.
- `routes/`: Contains route configurations.
- `utils/`: Houses utility functions.
- `public/`: Directory for serving static files.

## Contributing

Contributions are welcome! Please follow the [Contribution Guidelines](CONTRIBUTING.md).

## License

This project is licensed under the [MIT License](LICENSE).

---

**Note:** This README is a template. Update it with the specific details and structure of your project. Mention that the project is under development for transparency with potential contributors and users.
## Contributing

We welcome contributions to enhance and improve the project. If you'd like to contribute, please follow the guidelines in the [CONTRIBUTING.md](CONTRIBUTING.md) file.

## License

This project is licensed under the [MIT License](LICENSE.md).



