/**
 * @param {Object?} options
 * @param {string} [options.delimiter=','] - Specify what is the CSV delimeter.
 * @param {boolean} [options.skipEmptyLines=false] - Should empty lines be automatically skipped?
 * @param {boolean} [options.parseNumbers=false] - Automatically parse numbers (with a . as the decimal separator).
 * @param {boolean} [options.parseBooleans=false] - Automatically parse booleans (strictly lowercase `true` and `false`).
 * @param {boolean} [options.ltrim=false] - Automatically trim first column.
 * @param {boolean} [options.rtrim=false] - Automatically trim last column.
 * @param {boolean} [options.trim=false] - If true, then both 'ltrim' and 'rtrim' are set to true.
 * @param {boolean} [options.skipHeader=false] - If true, then skip the first header row.
 * @param {boolean} [options.rowAsObject=false] - If true, each row will be converted automatically to an object based
 *                                             on the header. This implied `skipHeader=true`.
 * @param {boolean} [options.errorLog=false] - If true, errors will be logged to the console whether the `error` event is used or not.
 * @returns {ProcessCSV}
 * @constructor
 */
var ProcessCSV = function (options) {

	let _this = this;
	let pause = false;
	let opts = {
		delimiter: options.delimiter || ',',
		skipEmptyLines: options.skipEmptyLines || false,
		parseNumbers: options.parseNumbers || false,
		parseBooleans: options.parseBooleans || false,
		ltrim: options.ltrim || false,
		rtrim: options.rtrim || false,
		trim: options.trim || false,
		skipHeader: options.skipHeader || false,
		rowAsObject: options.rowAsObject || false,
		errorLog: options.errorLog || false,
	};

	if (opts.trim) opts.ltrim = opts.rtrim = true;

	if (opts.rowAsObject) opts.skipHeader = true;

	// Contains evey line in the csv file in a single field [line1, line2...]
	let allDataLines = [];
	// Contains the header of the csv file
	let dataHeader = [];
	// Errors array
	let errors = [];

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
	 * @desc Processes the data from the csv file and filters it
	 * @param {String} csv 
	 */
	const processData = async function (csv) {
		allDataLines = csv.split(/\r\n|\n/);

		if (!allDataLines || !allDataLines[0]) {
			logError('w', 'No data to process, file is empty!');
			dispatch('error', new Error('No data to process, file is empty!'));

			return _this;
		} else {
			if (!opts.skipHeader) {
				dataHeader = allDataLines[0].split(opts.delimiter);
				if (!opts.rowAsObject)
					dispatch('header', dataHeader);
			}

			await formatDataRows();

			dispatch('finish', null);
		}
	};

	/**
	 * @desc Format data rows according to the given options
	 * @returns {Array}
	 */
	const formatDataRows = async function () {
		let hold = !opts.skipEmptyLines ? allDataLines : allDataLines.filter(k => k != null && k !== '');

		for (let j = 0; j < hold.length; j++) {
			if (opts.skipHeader && j === 0)
				continue;

			// if paused stop the loop untill the user resumes
			if (j > 0 && pause)
				await pauseLoop();

			let row = hold[j].split(opts.delimiter);
			if (opts.ltrim) row[0] = row[0].trim()
			if (opts.rtrim) row[row.length - 1] = row[row.length - 1].trim();

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

			return col
		});
	}

	/**
	 * @desc Parse any numbers in a row to numbers(float)
	 * @param {Array} row 
	 * @returns {Array}
	 */
	const parseRowNumbers = function (row) {
		return row.map(col => {
			if (parseFloat(col) || col === '0')
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
			dispatch('error', new Error('Cannot read file!'));

			return _this;
		}
	};

	/**
	 * @desc logs an error to the console
	 * @param {String} type - e = error | w = warning
	 * @param {String} message 
	 */
	const logError = function (type, message) {
		if (!errorLog) return;

		type === "e" ? console.error(message) : console.warn(message);
	}

	/**
	 * @desc Handles a specific file => this is the starting point of the ProcessCSV
	 * @param {Object} file 
	 */
	this.processFile = function (file) {
		if (file)
			if (window.FileReader) {
				readAsText(file);

				return _this;
			} else {
				logError('e', 'FileReader are not supported in this browser, please switch to a different browser.');
				dispatch('error', new Error('FileReader are not supported in this browser, please switch to a different browser.'));

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
	 * @desc Resume when you are ready to receive and process more rows.
	 */
	this.resume = function () {
		dispatch('resume-row', 'Receiving more rows...');
	};

	/**
	 * @desc Dispatch a custom event
	 * @param {String} name - event name
	 * @param {*} event - contains the data passed to the event
	 */
	const dispatch = function (name, event) {
		let callbacks = _this[name];
		if (callbacks) callbacks.forEach(callback => callback(event));
	};

	/**
	 * @desc Listen to a specific event
	 * @param {String} name - event name
	 * @param {Function} callback - callback function
	 */
	this.on = function (name, callback) {
		let callbacks = this[name];
		if (!callbacks) this[name] = [callback];
		else callbacks.push(callback);

		return this;
	};

};