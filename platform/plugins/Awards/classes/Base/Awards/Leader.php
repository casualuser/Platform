<?php

/**
 * Autogenerated base class representing leader rows
 * in the Awards database.
 *
 * Don't change this file, since it can be overwritten.
 * Instead, change the Awards_Leader.php file.
 *
 * @module Awards
 */
/**
 * Base class representing 'Leader' rows in the 'Awards' database
 * @class Base_Awards_Leader
 * @extends Db_Row
 *
 * @property string $app
 * @property string|Db_Expression $day
 * @property string $userId
 * @property integer $points
 */
abstract class Base_Awards_Leader extends Db_Row
{
	/**
	 * @property $app
	 * @type string
	 */
	/**
	 * @property $day
	 * @type string|Db_Expression
	 */
	/**
	 * @property $userId
	 * @type string
	 */
	/**
	 * @property $points
	 * @type integer
	 */
	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	function setUp()
	{
		$this->setDb(self::db());
		$this->setTable(self::table());
		$this->setPrimaryKey(
			array (
			  0 => 'app',
			  1 => 'day',
			  2 => 'userId',
			)
		);
	}

	/**
	 * Connects to database
	 * @method db
	 * @static
	 * @return {iDb} The database object
	 */
	static function db()
	{
		return Db::connect('Awards');
	}

	/**
	 * Retrieve the table name to use in SQL statement
	 * @method table
	 * @static
	 * @param {boolean} [$with_db_name=true] Indicates wheather table name shall contain the database name
 	 * @return {string|Db_Expression} The table name as string optionally without database name if no table sharding
	 * was started or Db_Expression class with prefix and database name templates is table was sharded
	 */
	static function table($with_db_name = true)
	{
		if (Q_Config::get('Db', 'connections', 'Awards', 'indexes', 'Leader', false)) {
			return new Db_Expression(($with_db_name ? '{$dbname}.' : '').'{$prefix}'.'leader');
		} else {
			$conn = Db::getConnection('Awards');
  			$prefix = empty($conn['prefix']) ? '' : $conn['prefix'];
  			$table_name = $prefix . 'leader';
  			if (!$with_db_name)
  				return $table_name;
  			$db = Db::connect('Awards');
  			return $db->dbName().'.'.$table_name;
		}
	}
	/**
	 * The connection name for the class
	 * @method connectionName
	 * @static
	 * @return {string} The name of the connection
	 */
	static function connectionName()
	{
		return 'Awards';
	}

	/**
	 * Create SELECT query to the class table
	 * @method select
	 * @static
	 * @param $fields {array} The field values to use in WHERE clauseas as 
	 * an associative array of `column => value` pairs
	 * @param [$alias=null] {string} Table alias
	 * @return {Db_Query_Mysql} The generated query
	 */
	static function select($fields, $alias = null)
	{
		if (!isset($alias)) $alias = '';
		$q = self::db()->select($fields, self::table().' '.$alias);
		$q->className = 'Awards_Leader';
		return $q;
	}

	/**
	 * Create UPDATE query to the class table
	 * @method update
	 * @static
	 * @param [$alias=null] {string} Table alias
	 * @return {Db_Query_Mysql} The generated query
	 */
	static function update($alias = null)
	{
		if (!isset($alias)) $alias = '';
		$q = self::db()->update(self::table().' '.$alias);
		$q->className = 'Awards_Leader';
		return $q;
	}

	/**
	 * Create DELETE query to the class table
	 * @method delete
	 * @static
	 * @param [$table_using=null] {object} If set, adds a USING clause with this table
	 * @param [$alias=null] {string} Table alias
	 * @return {Db_Query_Mysql} The generated query
	 */
	static function delete($table_using = null, $alias = null)
	{
		if (!isset($alias)) $alias = '';
		$q = self::db()->delete(self::table().' '.$alias, $table_using);
		$q->className = 'Awards_Leader';
		return $q;
	}

	/**
	 * Create INSERT query to the class table
	 * @method insert
	 * @static
	 * @param [$fields=array()] {object} The fields as an associative array of `column => value` pairs
	 * @param [$alias=null] {string} Table alias
	 * @return {Db_Query_Mysql} The generated query
	 */
	static function insert($fields = array(), $alias = null)
	{
		if (!isset($alias)) $alias = '';
		$q = self::db()->insert(self::table().' '.$alias, $fields);
		$q->className = 'Awards_Leader';
		return $q;
	}
	/**
	 * Inserts multiple records into a single table, preparing the statement only once,
	 * and executes all the queries.
	 * @method insertManyAndExecute
	 * @static
	 * @param {array} [$records=array()] The array of records to insert. 
	 * (The field names for the prepared statement are taken from the first record.)
	 * You cannot use Db_Expression objects here, because the function binds all parameters with PDO.
	 * @param {array} [$options=array()]
	 *   An associative array of options, including:
	 *
	 * * "chunkSize" {integer} The number of rows to insert at a time. defaults to 20.<br/>
	 * * "onDuplicateKeyUpdate" {array} You can put an array of fieldname => value pairs here,
	 * 		which will add an ON DUPLICATE KEY UPDATE clause to the query.
	 *
	 */
	static function insertManyAndExecute($records = array(), $options = array())
	{
		self::db()->insertManyAndExecute(self::table(), $records, $options);
	}
	
	/**
	 * Method is called before setting the field and verifies if value is string of length within acceptable limit.
	 * Optionally accept numeric value which is converted to string
	 * @method beforeSet_app
	 * @param {string} $value
	 * @return {array} An array of field name and value
	 * @throws {Exception} An exception is thrown if $value is not string or is exceedingly long
	 */
	function beforeSet_app($value)
	{
		if ($value instanceof Db_Expression) return array('app', $value);
		if (!is_string($value) and !is_numeric($value))
			throw new Exception('Must pass a string to '.$this->getTable().".app");
		if (strlen($value) > 255)
			throw new Exception('Exceedingly long value being assigned to '.$this->getTable().".app");
		return array('app', $value);			
	}

	/**
	 * Method is called before setting the field and normalize the date string
	 * @method beforeSet_day
	 * @param {string} $value
	 * @return {array} An array of field name and value
	 * @throws {Exception} An exception is thrown if $value does not represent valid date
	 */
	function beforeSet_day($value)
	{
		if ($value instanceof Db_Expression) return array('day', $value);
		$date = date_parse($value);
		if (!empty($date['errors']))
			throw new Exception("Date $value in incorrect format being assigned to ".$this->getTable().".day");
		foreach (array('year', 'month', 'day', 'hour', 'minute', 'second') as $v)
			$$v = $date[$v];
		$value = sprintf("%04d-%02d-%02d", $year, $month, $day);
		return array('day', $value);			
	}

	/**
	 * Method is called before setting the field and verifies if value is string of length within acceptable limit.
	 * Optionally accept numeric value which is converted to string
	 * @method beforeSet_userId
	 * @param {string} $value
	 * @return {array} An array of field name and value
	 * @throws {Exception} An exception is thrown if $value is not string or is exceedingly long
	 */
	function beforeSet_userId($value)
	{
		if ($value instanceof Db_Expression) return array('userId', $value);
		if (!is_string($value) and !is_numeric($value))
			throw new Exception('Must pass a string to '.$this->getTable().".userId");
		if (strlen($value) > 31)
			throw new Exception('Exceedingly long value being assigned to '.$this->getTable().".userId");
		return array('userId', $value);			
	}

	/**
	 * Method is called before setting the field and verifies if integer value falls within allowed limits
	 * @method beforeSet_points
	 * @param {integer} $value
	 * @return {array} An array of field name and value
	 * @throws {Exception} An exception is thrown if $value is not integer or does not fit in allowed range
	 */
	function beforeSet_points($value)
	{
		if ($value instanceof Db_Expression) return array('points', $value);
		if (!is_numeric($value) or floor($value) != $value)
			throw new Exception('Non-integer value being assigned to '.$this->getTable().".points");
		if ($value < -32768 or $value > 32767)
			throw new Exception("Out-of-range value '$value' being assigned to ".$this->getTable().".points");
		return array('points', $value);			
	}

	/**
	 * Method is called after field is set and used to keep $fieldsModified property up to date
	 * @method afterSet
	 * @param {string} $name The field name
	 * @param {mixed} $value The value of the field
	 * @return {mixed} Original value
	 */
	function afterSet($name, $value)
	{
		if (!in_array($name, $this->fieldNames()))
			$this->notModified($name);
		return $value;			
	}

	/**
	 * Check if mandatory fields are set and updates 'magic fields' with appropriate values
	 * @method beforeSave
	 * @param {array} $value The array of fields
	 * @return {array}
	 * @throws {Exception} If mandatory field is not set
	 */
	function beforeSave($value)
	{
		if (!$this->retrieved) {
			$table = $this->getTable();
			foreach (array('app','day','userId') as $name) {
				if (!isset($value[$name])) {
					throw new Exception("the field $table.$name needs a value, because it is NOT NULL, not auto_increment, and lacks a default value.");
				}
			}
		}
		return $value;			
	}

	/**
	 * Retrieves field names for class table
	 * @method fieldNames
	 * @static
	 * @param {string} [$table_alias=null] If set, the alieas is added to each field
	 * @param {string} [$field_alias_prefix=null] If set, the method returns associative array of `'prefixed field' => 'field'` pairs
	 * @return {array} An array of field names
	 */
	static function fieldNames($table_alias = null, $field_alias_prefix = null)
	{
		$field_names = array('app', 'day', 'userId', 'points');
		$result = $field_names;
		if (!empty($table_alias)) {
			$temp = array();
			foreach ($result as $field_name)
				$temp[] = $table_alias . '.' . $field_name;
			$result = $temp;
		} 
		if (!empty($field_alias_prefix)) {
			$temp = array();
			reset($field_names);
			foreach ($result as $field_name) {
				$temp[$field_alias_prefix . current($field_names)] = $field_name;
				next($field_names);
			}
			$result = $temp;
		}
		return $result;			
	}
};