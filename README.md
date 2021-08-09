# simple-csv-processor

[![npm Version](https://img.shields.io/badge/simple--csv--processor-v1.0.0-green)](https://npmjs.org/package/simple-csv-processor)

A CSV file reader, with many features, and ability to work with large datasets.

## Features:

* Choosing a different delimiter instead of the comma
* Automatic skipping empty lines
* Automatic skipping of the first header row
* Automatic parsing of numbers and booleans
* Automatic trimming
* You can `.pause()` if you need some time to process the current row and `.resume()` when you are ready to receive and process more rows.
* You can `.end()` if you want to end the process. After this method is called the process will end and no more rows will be parsed. 
* Consumes and emits rows one-by-one, allowing you to process datasets in any size imaginable.

## Installation:

```
npm install simple-csv-processor
```

## Options

Name | Type | Default | Explanation
---- | ---- | ------- | -----------
  `delimiter` | `String` | `,` | The character that separates between cells.
  `allowSpecialQuotes` | `Boolean` | `true` | Should quotes be treated as a special character that wraps cells.
  `quote` | `String` | `"` | If `allowSpecialQuotes` is true, this will specify the quote character. 
  `skipComments` | `Boolean | String` | `false` | If true, lines which begin with # will be skipped. To use a custom character passe it as a sring.
  `skipLines` | `Number` | `0` | Specifies the number of lines at the beginning of the file to skip over.
  `skipEmptyLines` | `Boolean` | `false` | Should empty lines be automatically skipped?
  `parseNumbers` | `Boolean` | `false` | Should numbers be automatically parsed? This will parse any format supported by `parseFloat`.
  `parseBooleans` | `Boolean` | `false` | Automatically parse booleans (Auto conversion to lowercase `true` and `false`).
  `ltrim` | `Boolean` | `false` | Automatically left-trims columns.
  `rtrim` | `Boolean` | `false` | Automatically right-trims columns.
  `trim` | `Boolean` | `false` | If true, trim all columns.
  `maxRowBytes` | `Number` | `MAX_ROW_BYTES` | Specifies the maximum number of bytes per row, the default value is on 10 peta byte.
  `rowAsObject` | `Boolean` | `false` | If true, each row will be converted automatically to an object based on the header. This implies `skipLines=1 & strict=true`.
  `strict` | `Boolean` | `false` | If true, the number of columns in each row must match the number of headers.
  `errorLog` | `Boolean` | `false` | If true, errors will be logged to the console whether the `error` event is used or not.
  
## Events:

A `'row'` event will be emitted with each row, either in an array format (`(string|number|boolean)[]`) or an Object format (`Object<string, (string|number|boolean)>`), depending on the `rowAsObject` option.  
A preliminary `'header'` event will be emitted with the first row, only in an array format.  
2 more usefull events: `finish` and `error`.

## Basic usage example:

Suppose you have a CSV file data.csv which contains the data:

```
Name, Age
Jone Doe,24
Tom Doe,22
```

It could then be parsed, and results shown like so:

```javascript
document.querySelector('#csv-input').addEventListener('change', processCSVFile);

function processCSVFile(e){
    let file = e.target.files[0];
    let process = new ProcessCSV({
        delimiter: ',',
        parseBooleans: true,
        parseNumbers: true,
        trim: true,
        strict: true,
        rowAsObject: false,
    })  
        .process(file)
        .on('header', header => {
            // If rowAsObject is set to true, the header event will not be emitted.
            console.log("header: ", header); // Header: ['Name', 'Age']
        })
        .on('row', row => {
            console.log("row: ", row); // First row: ['Jone Doe', 24]

            // If rowAsObject is set to true, the row will be converted to an object.
            // First row: {Name: 'Jone Doe', Age: 24}
        })
        .on('finish', () => {
            // Once the all rows have been parsed, this event will be emitted.
            console.log("No more rows!");
        })
        .on('error', error => {
            // Any errors will be in this block.
            console.error(error);
        });
}

```

## Advanced usage example:

When working with large datasets, these options might come in handy. Also the `pause` & `resume` event will be needed. Here's an example using 
all the available features:

```javascript

let file = e.target.files[0];
let process = new ProcessCSV({
    // seperator
    delimiter: ',',
    // skippers
    skipLines: 0,
    skipEmptyLines: true,
    skipComments: "#",
    // conversion
    parseBooleans: true,
    parseNumbers: true,
    // quote handler
    allowSpecialQuotes: true,
    quote: '"',
    // more options
    trim: true,
    strict: true,
    maxRowBytes: 200000,
}).process(file)
    .on('header', header => {
        console.log("header: ", header);
    })
    .on('row', row => {
        process.pause();

        if(false) 
            process.end(); // end the process
        else
            process.resume(); // receive the next row
    })
    .on('finish', () => {
        console.log("No more rows to process!")
    })
    .on('error', error => {
        console.error(error)
    });
```

## Contributing

If you have anything to contribute, or functionality that you lack - you are more than welcome to participate in this!
If anyone wishes to contribute unit tests that also would be great.


## License

The MIT License (MIT)

Copyright (c) 2021 Essam Abed (abedissam95@gmail.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.