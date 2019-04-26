# Download Stream Example

This is an example of downloading a big CSV file in a _streamed_ way.

Instead of downloading and JSON-parsing the whole data, we can parse it as it gets received byte by byte, being way more memory efficient and preventing the browser from crashing when downloading 100mb of data.

## Running it

Clone the repository, and then:

```
npm install
npm start
```

Now open http://localhost:3000.

## How it works

In this example there are two main pieces: The backend and the frontend.

The backend is just a Node server that will generate a 75K lines CSV file (approximately 140mb of data) in each request to an specific endpoint.

The frontend uses fetch and readable stream APIs to download the data byte by byte.
