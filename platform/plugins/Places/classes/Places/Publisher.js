/**
 * Class representing publisher rows.
 *
 * This description should be revised and expanded.
 *
 * @module Places
 */
var Q = require('Q');
var Db = Q.require('Db');
var Publisher = Q.require('Base/Places/Publisher');

/**
 * Class representing 'Publisher' rows in the 'Places' database
 * @namespace Places
 * @class Publisher
 * @extends Base.Places.Publisher
 * @constructor
 * @param {Object} fields The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Places_Publisher (fields) {

	// Run mixed-in constructors
	Places_Publisher.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Publisher.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Places_Publisher, Publisher);

/*
 * Add any public methods here by assigning them to Places_Publisher.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Places_Publisher.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Places_Publisher;