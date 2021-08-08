# simple-csv-processor

[![npm Version](https://img.shields.io/badge/simple--csv--processor-v1.0.0-green)](https://npmjs.org/package/simple-csv-processor)

A CSV file reader, with many features, and ability to work with large datasets.

## Included features: (can be turned on and off)

* Choosing a different delimiter instead of the comma
* Automatic skipping empty lines
* Automatic skipping of the first header row
* Automatic parsing of numbers and booleans
* Automatic trimming
* You can `.pause()` if you need some time to process the current row and `.resume()` when you are ready to receive and process more rows.
* Consumes and emits rows one-by-one, allowing you to process datasets in any size imaginable.

## Installation:

```
npm install --save simple-csv-processor
```

The options you can pass are:

Name | Type | Default | Explanation
---- | ---- | ------- | -----------
  `delimiter` | `String` | `,` | The character that separates between cells.
  `skipEmptyLines` | `Boolean` | `false` | Should empty lines be automatically skipped?
  `skipHeader` | `Boolean` | `false` | Should the first header row be skipped?
  `rowAsObject` | `Boolean` | `false` | If true, each row will be converted automatically to an object based on the header. This implied `skipHeader=true`.
  `parseNumbers` | `Boolean` | `false` | Should numbers be automatically parsed? This will parse any format supported by `parseFloat`.
  `parseBooleans` | `Boolean` | `false` | Automatically parse booleans (strictly lowercase `true` and `false`).
  `ltrim` | `Boolean` | `false` | Automatically left-trims columns.
  `rtrim` | `Boolean` | `false` | Automatically right-trims columns.
  `trim` | `Boolean` | `false` | If true, then both 'ltrim' and 'rtrim' are set to true.
  `errorLog` | `Boolean` | `false` | If true, errors will be logged to the console whether the `error` event is used or not.
  
## Events:

A `'row'` event will be emitted with each row, either in an array format (`(string|number|boolean)[]`) or an Object format (`Object<string, (string|number|boolean)>`), depending on the `rowAsObject` option.  
A preliminary `'header'` event will be emitted with the first row, only in an array format.  
Another 2 events usefull events: `finish` and `error`.

## Usage example:

```javascript

let file = e.target.files[0];
let process = new ProcessCSV({
    delimiter: ',',
    skipEmptyLines: true,
    skipHeader: false,
    rowAsObject: false,
    parseNumbers: true,
    parseBooleans: true,
    trim: true,
    errorLog: false,
})  
    .processFile(file)
    .on('header', header => {
        console.log("header: ", header);
    })
    .on('row', rowData => {
        console.log("row: ", rowData);

        // you can pause receiving more rows if you need time to process the current one.
        process.pause();
        setTimeout(() => {
            // then you can resume
            process.resume();
        }, 100);
    })
    .on('finish', () => {
        console.log("No more rows!");
    })
    .on('error', error => {
        console.error(error);
    });

```

## Contributing

If you have anything to contribute, or functionality that you lack - you are more than welcome to participate in this!
If anyone wishes to contribute unit tests that also would be great.


## License

All the code here is under MIT license. Which means you could do virtually anything with the code.
I will appreciate it very much if you keep an attribution where appropriate.

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
