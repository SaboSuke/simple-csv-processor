var ProcessCSV = function (options) {

	let _this = this;
	let pause = false;
	let opts = {
		// The character that separates between cells
		delimiter: options.delimiter || ',',
		// Should empty lines be automatically skipped?
		skipEmptyLines: options.skipEmptyLines || false,
		// Should the first header row be skipped?
		skipHeader: options.skipHeader || false,
		// If true, each row will be converted automatically to an object based on the header. This implied skipHeader=true.
		rowAsObject: options.rowAsObject || false,
		// Should numbers be automatically parsed? This will parse any format supported by parseFloat including scientific notation, Infinity and NaN.
		parseNumbers: options.parseNumbers || false,
		// Automatically parse booleans (strictly lowercase true and false)
		parseBooleans: options.parseBooleans || false,
		// Automatically left-trims columns
		ltrim: options.ltrim || false,
		// Automatically right-trims columns
		rtrim: options.rtrim || false,
		// If true, then both 'ltrim' and 'rtrim' are set to true
		trim: options.trim || false,
	};

	if (opts.trim) opts.ltrim = opts.rtrim = true;

	if (opts.rowAsObject) opts.skipHeader = true;

	// Contains evey line in the csv file in a single field [line1, line2...]
	let allDataLines = [];
	// Contains the header of the csv file
	let dataHeader = [];

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
		} else {
			if (opts.rowAsObject)
				dataHeader = allDataLines[0].split(opts.delimiter);

			await formatDataRows();

			_this.dispatch('finish', 'File has been processed!');
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

			if (opts.parseNumbers && row[0] != '') row = parseRowNumbers(row);
			if (opts.parseBooleans && row[0] != '') row = parseRowBooleans(row);

			// dispatch row event
			if (opts.rowAsObject && row[0] !== '')
				_this.dispatch('row', createRowObject(row));
			else if (!opts.rowAsObject)
				_this.dispatch('row', row);
		}

		return _this;
	}

	/**
	 * @desc Parse any 'true' or 'false' string in a row to boolean 
	 * @param {Array} row 
	 * @returns {Array}
	 */
	const parseRowBooleans = function (row) {
		for (let x = 0; x < row.length; x++) {
			const col = row[x];
			if (col === 'true' || col === 'false')
				row[x] = col === 'true';
		}

		return row;
	}

	/**
	 * @desc Parse any numbers in a row to numbers(float)
	 * @param {Array} row 
	 * @returns {Array}
	 */
	const parseRowNumbers = function (row) {
		for (let x = 0; x < row.length; x++) {
			const col = row[x];
			if (parseFloat(col) || col === '0')
				row[x] = parseFloat(col);
		}

		return row;
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
			alert("Cannot read file, this file might be corrupted.");
			logError('e', 'Cannot read file, this file might be corrupted.');
		}
	};

	/**
	 * @desc logs an error to the console
	 * @param {String} type - e = error | w = warning
	 * @param {String} message 
	 */
	const logError = function (type, message) {
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
				alert('FileReader are not supported in this browser, please switch to a different browser.');
				logError('e', 'FileReader are not supported in this browser, please switch to a different browser.');
			}
	};

	/**
	 * @desc Sets the delimiter for the splitted data lines
	 * @param {Object} delimiter - { byComma: true, bySpace: false, bySpaceOrComma: false }
	 */
	this.setDelimiter = function (delimiter = {
		byComma: true,
		bySpace: false,
		bySpaceOrComma: false,
	}) {
		opts.delimiter.byComma = delimiter.byComma;
		opts.delimiter.bySpace = delimiter.bySpace;
		opts.delimiter.bySpaceOrComma = delimiter.bySpaceOrComma;
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
		this.dispatch('resume-row', 'Receiving more rows...');
	};

	// To dispatch and listen to a custom event you can use these methods
	/**
	 * @desc Listen to a dispatched custom event
	 * @param {String} name - event name
	 * @param {Function} callback - callback function
	 */
	this.on = function (name, callback) {
		let callbacks = this[name];
		if (!callbacks) this[name] = [callback];
		else callbacks.push(callback);

		return this;
	};

	/**
	 * @desc Dispatch a custom event
	 * @param {String} name - event name
	 * @param {*} event - contains the data passed to the event
	 */
	this.dispatch = function (name, event) {
		let callbacks = this[name];
		if (callbacks) callbacks.forEach(callback => callback(event));
	};
};