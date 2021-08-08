/**
 * @desc gets the chosen delimiter
 * @returns {*}
 */
const getDelimiter = function () {
    if (opts.delimiter.bySpaceOrComma)
        return /[ ,]+/;
    else if (opts.delimiter.bySpace)
        return /[ ]+/;
    else if (opts.delimiter.byComma)
        return /[,]+/;

    logError('e', 'You did not specify a delimiter!');
    return undefined;
}


/**
 * @desc Gets the output after processing the file
 * @param {String} lineBreak - specifies the string you want after each line(example: <br> or \n)
 * @returns {Object | String} - final data 
 */
this.getOutput = function (lineBreak = '') {
    let data = '';
    splittedData.forEach(line => data += line + lineBreak);

    return {
        dataMatrix: splittedDataMatrix,
        data
    };
};