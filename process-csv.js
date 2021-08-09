/**
 * Package: simple-csv-processor
 * Version: 1.0.0
 * Author: Essam Abed
 * License: MIT
 */

const FLOAT_REGEXP = /^[-+]?[0-9]+(?:\.[0-9]*)?(?:[eE]\+[0-9]+)?$|^(?:[0-9]+)?\.[0-9]+(?:e+[0-9]+)?$|^[-+]?Infinity$|^[-+]?NaN$/;
const MAX_ROW_BYTES = 8e+16; // 10 peta byte

/**
 * @param {Object?} options
 * @param {string} [options.delimiter=','] - Specify what is the CSV delimeter.
 * @param {boolean} [options.allowSpecialQuotes=false] - Should quotes be treated as a special character that wraps cells. Does not include the header row.
 * @param {string} [options.quote='"'] - If allowSpecialQuotes is true, this will specify the quote character.
 * @param {boolean | string} [options.skipComments=false] - If true, lines which begin with # will be skipped. To use
 * 														a custom character passe it as a sring.
 * @param {Number} [options.skipLines=0] - Specifies the number of lines at the beginning of the file to skip over.
 * @param {boolean} [options.skipEmptyLines=false] - Should empty lines be automatically skipped?
 * @param {boolean} [options.parseNumbers=false] - Automatically parse numbers (with a . as the decimal separator).
 * @param {boolean} [options.parseBooleans=false] - Automatically parse booleans (Auto conversion to lowercase `true` and `false`).
 * @param {boolean} [options.ltrim=false] - Automatically let trim columns.
 * @param {boolean} [options.rtrim=false] - Automatically right trim columns.
 * @param {boolean} [options.trim=false] - If true, trim all columns.
 * @param {Number} [options.maxRowBytes=MAX_ROW_BYTES] - Specifies the maximum number of bytes per row, the default value is on 10 peta byte.
 * @param {boolean} [options.rowAsObject=false] - If true, each row will be converted automatically to an object based
 *                                             on the header. This implies `skipLines=1 & strict=true`.
 * @param {boolean} [options.strict=false] - If true, the number of columns in each row must match the number of headers.
 * @param {boolean} [options.errorLog=false] - If true, errors will be logged to the console whether the `error` event is used or not.
 * @returns {ProcessCSV}
 * @constructor
 */
const ProcessCSV = function (options) {

	let _this = this;
	let pause = false;
	let opts = {
		delimiter: options.delimiter || ',',
		allowSpecialQuotes: options.allowSpecialQuotes || false,
		quote: options.quote || '"',
		skipComments: options.skipComments || false,
		skipLines: options.skipLines || 0,
		skipEmptyLines: options.skipEmptyLines || false,
		parseNumbers: options.parseNumbers || false,
		parseBooleans: options.parseBooleans || false,
		ltrim: options.ltrim || false,
		rtrim: options.rtrim || false,
		trim: options.trim || false,
		maxRowBytes: options.maxRowBytes || MAX_ROW_BYTES,
		rowAsObject: options.rowAsObject || false,
		strict: options.strict || false,
		errorLog: options.errorLog || false,
	};

	if (opts.rowAsObject) {
		opts.strict = true;

		if (!opts.skipLines)
			opts.skipLines = 1;
	}

	let allDataLines = [];
	let dataHeader = [];
	let ended = false;

	/**
	 * @desc Reads the file as a text
	 * @param {Object} fileToRead 
	 */
	const readAsText = function (fileToRead) {
		var reader = new FileReader();

		// Handle errors & load
		reader.onload = loadHandler;
		reader.onerror = errorHandler;

		// Read file
		reader.readAsText(fileToRead);
	};

	/**
	 * @desc Handles loading the CSV file
	 * @param {Object} event 
	 */
	const loadHandler = function (event) {
		var csv = event.target.result;
		processData(csv);
	};

	/**
	 * Handles header columns that starts and ends with quotes
	 * @param {Array} header 
	 * @returns {Array} 
	 */
	const handleHeader = function (header) {
		for (let i = 0; i < header.length; i++) {
			const col = header[i].trim();
			if ((col[0] === '"' && col[col.length - 1] === '"') || (col[0] === '\'' && col[col.length - 1] === '\''))
				header[i] = col.substring(1, col.length - 1);
		}

		return header;
	}

	/**
	 * @desc Processes the data
	 * @param {string} csv 
	 */
	const processData = async function (csv) {
		allDataLines = csv.split(/\r\n|\n/);

		if (!allDataLines || !allDataLines[0]) {
			logError('w', 'No data to process, file is empty!');
			dispatch('error', throwError('No data to process, file is empty!'));

			return _this;
		} else {
			if (opts.skipLines)
				for (let i = 0; i < opts.skipLines; i++) {
					if (i === 0)
						dataHeader = allDataLines.shift().split(opts.delimiter);
					else
						allDataLines.shift();
				}
			else if (!opts.skipLines) {
				dataHeader = allDataLines.shift().split(opts.delimiter);
			}

			if (dataHeader.length) {
				dataHeader = handleHeader(dataHeader);
				if (!opts.rowAsObject && !opts.skipLines) dispatch('header', dataHeader);
			}

			await processRows();
			dispatch('finish', null);
		}
	};

	/**
	 * @desc Format data rows according to the given options
	 * @returns {Array}
	 */
	const processRows = async function () {
		let hold = !opts.skipEmptyLines ? allDataLines : allDataLines.filter(k => k != null && k !== '');

		for (let j = 0; j < hold.length; j++) {
			if (j > 0 && pause)
				await pauseLoop();

			let row = hold[j].split(opts.delimiter);

			if (opts.skipComments) {
				const char = typeof opts.skipComments === 'string' ? opts.skipComments : '#';
				if (row[0][0] === char) continue;
			}

			if (opts.allowSpecialQuotes) row = hanldeSpecialQuotes(row);

			if (handleRowErrors(row, j + 1)) return;

			if (opts.ltrim) row[0] = row[0].replace(/^\s+/, "");
			if (opts.rtrim) row[row.length - 1] = row[row.length - 1].replace(/$\s+/, "");
			if (opts.trim) row = row.map(col => col.trim());

			if (opts.parseNumbers && row[0] !== '') row = parseRowNumbers(row);
			if (opts.parseBooleans && row[0] !== '') row = parseRowBooleans(row);

			// dispatch row event
			if (opts.rowAsObject && row[0] !== '')
				dispatch('row', createRowObject(row));
			else if (!opts.rowAsObject)
				dispatch('row', row);
		}

		return _this;
	}

	/**
	 * @desc Hanldes special quotes column based in a row
	 * @param {Array} row 
	 * @returns {Array}
	 */
	const hanldeSpecialQuotes = function (row) {
		let result = [];
		let status = 0;
		for (let i = 0; i < row.length; i++) {
			let cell = row[i];
			if (cell[0] == opts.quote && cell[cell.length - 1] !== opts.quote) {
				result.push(cell.slice(1));
				status = 1;
			} else if (cell[0] !== opts.quotecell && [cell.length - 1] == opts.quote) {
				result[(result.length - 1)] += " " + (cell.slice(0, -1));
				status = 0;
			} else if (status == 1) {
				result[result.length - 1] += (cell);
				status = 1;
			} else {
				result.push(cell);
				status = 0;
			}
		}

		return result;
	}

	/**
	 * @desc Handles any erros in a row
	 * @param {Array} row 
	 * @returns {boolean}
	 */
	const handleRowErrors = function (row, index) {
		let skip = true;
		if (opts.skipLines)
			skip = opts.skipLines > (index - 1);

		if (skip && opts.strict && row.length !== dataHeader.length) {
			console.log("header length:", dataHeader.length)
			console.log("row length:", row.length)
			logError('e', `Row length does not match headers(in file row number ${index}).`);
			dispatch('error', throwError(`Row length does not match headers(in file row number ${index}).`));
			return true;
		} else {
			const str = JSON.stringify(row.join('')).replace(/[[],""]/g, '');
			if (opts.maxRowBytes < str.length) {
				logError('e', `Maximum row size has been exceeded(in file row number ${index}).`);
				dispatch('error', throwError(`Maximum row size has been exceeded(in file row number ${index}).`));
				return true;
			}
		}

		return false;
	}

	/**
	 * @desc Parse any 'true' or 'false' string in a row to boolean 
	 * @param {Array} row 
	 * @returns {Array}
	 */
	const parseRowBooleans = function (row) {
		return row.map(col => {
			if (typeof col === 'string') {
				let c = col.toLowerCase();
				if (c === 'true' || c === 'false')
					return c === 'true';
			}

			return col;
		});
	}

	/**
	 * @desc Parse any string numbers in a row to numbers(float)
	 * @param {Array} row 
	 * @returns {Array}
	 */
	const parseRowNumbers = function (row) {
		return row.map(col => {
			if (FLOAT_REGEXP.test(col))
				return parseFloat(col);

			return col;
		});
	}

	/**
	 * @desc Creates an object for every given row based on the header
	 * @param {Array} row 
	 * @returns {Object}
	 */
	const createRowObject = function (row) {
		let rowObject = {};
		for (let x = 0; x < dataHeader.length; x++) {
			rowObject[dataHeader[x]] = row[x];
		}

		return rowObject;
	}

	/**
	 * @desc Checks if there's an error with the file 
	 * @param {Object} event 
	 */
	const errorHandler = function (event) {
		if (event.target.error.name == "NotReadableError") {
			logError('e', 'Cannot read file!');
			dispatch('error', throwError('Cannot read file!'));

			return _this;
		}
	};

	/**
	 * @desc logs an error to the console
	 * @param {string} type - e = error | w = warning
	 * @param {string} message 
	 */
	const logError = function (type, message) {
		if (!opts.errorLog) return;

		type === "e" ? console.error(message) : console.warn(message);
	}

	/**
	 * @desc Returns a new error instance
	 * @param {string} message 
	 * @returns {Object}
	 */
	const throwError = function (message) {
		return new Error(message);
	}

	/**
	 * @desc Handles a specific file
	 * @param {Object} file 
	 */
	this.process = function (file) {
		if (file)
			if (window.FileReader) {
				readAsText(file);

				return _this;
			} else {
				logError('e', 'FileReader are not supported in this browser, please switch to a different browser.');
				dispatch('error', throwError('FileReader are not supported in this browser, please switch to a different browser.'));

				return _this;
			}
	};

	/**
	 * @desc Pause the loop when the user decides to pause receiving data
	 * @returns {Promise}
	 */
	const pauseLoop = function () {
		return new Promise(resolve => {
			const resumeLoop = function () {
				pause = false;
				resolve("resolved");
			};

			_this.on('resume-row', resumeLoop);
		});
	};

	/**
	 * @desc Pause if you need some time to process the row
	 */
	this.pause = function () {
		pause = true;
	};

	/**
	 * @desc Resume when ready to receive and process more rows.
	 */
	this.resume = function () {
		setTimeout(() => dispatch('resume-row', 'Receiving more rows...'), 0);
	};

	/**
	 * @desc Ends processing
	 */
	this.end = function () {
		ended = true;
	}

	/**
	 * @desc Dispatch a custom event
	 * @param {string} name - event name
	 * @param {*} event - contains the data passed to the event
	 */
	const dispatch = function (name, event) {
		if (!ended) {
			let callbacks = _this[name];
			if (callbacks) callbacks.forEach(callback => callback(event));
		} else return;
	};

	/**
	 * @desc Listen to a specific event
	 * @param {string} name - event name
	 * @param {function} callback - callback function
	 */
	this.on = function (name, callback) {
		let callbacks = this[name];
		if (!callbacks) this[name] = [callback];
		else callbacks.push(callback);

		return this;
	};

};