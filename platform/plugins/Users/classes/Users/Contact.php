<?php
/**
 * @module Users
 */
/**
 * Class representing 'Contact' rows in the 'Users' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a contact row in the Users database.
 *
 * @class Users_Contact
 * @extends Base_Users_Contact
 */
class Users_Contact extends Base_Users_Contact
{
	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	function setUp()
	{
		parent::setUp();
	}
	
	/**
	 * Add contact with one or more labels
	 * @method addContact
	 * @static
	 * @param {string} $userId
	 *  The id of the user whose contact will be added
	 * @param {string} $contactUserId
	 *  The id of the user who is the contact
	 * @param {string|array} $label
	 *  The label of the contact. This can be a string or an array of strings, in which case
	 *  multiple contact rows are saved.
	 * @param {string} [$nickname='']
	 *  Optional nickname to assign to the contact
	 * @param {string} [$asUserId=null] The user to do this operation as.
	 *   Defaults to the logged-in user. Pass false to skip access checks.
	 * @throws {Q_Exception_RequiredField}
	 *	if $label is missing
	 * @return {array} Array of contacts that are saved
	 */
	static function addContact($userId, $label, $contactUserId, $nickname = '', $asUserId = null)
	{
		foreach (array('userId', 'label', 'contactUserId') as $field) {
			if (empty($$field)) {
				throw new Q_Exception_RequiredField($field);
			}
		}
		Users::canManageContacts($asUserId, $userId, $label, true);
		Users_User::fetch($userId, true);
		Users_User::fetch($contactUserId, true);
		$labels = is_array($label) ? $label : array($label);
		// Insert the contacts one by one
		$contacts = array();
		foreach ($labels as $l) {
			$contact = new Users_Contact();
			$contact->userId = $userId;
			$contact->label = $l;
			$contact->contactUserId = $contactUserId;
			if (isset($nickname)) {
				$contact->nickname = $nickname;
			}
			$contact->save(true);
			$contacts[] = $contact;
		}
		/**
		 * @event Users/Contact/addContact {after}
		 * @param {string} contactUserId
		 * @param {string} label
		 * @param {array} contacts
		 */
		Q::event('Users/Contact/addContact', 
			compact('contactUserId', 'label', 'contacts'), 
			'after'
		);
		return $contacts;
	}
	
	/**
	 * Update a particular contact with a given userId, label, contactId.
	 * @method updateContact
	 * @static
	 * @param {string} $userId
	 * @param {string} $label
	 * @param {string} $contactUserId
	 * @param {array} $updates should be an array with only one key: "nickname"
	 * @param {string} [$asUserId=null] The user to do this operation as.
	 *   Defaults to the logged-in user. Pass false to skip access checks.
	 * @throws {Users_Exception_NotAuthorized}
	 * @return {Db_Query_Mysql}
	 */
	static function updateContact($userId, $label, $contactUserId, $updates, $asUserId = null)
	{
		foreach (array('userId', 'label', 'contactUserId', 'updates') as $field) {
			if (empty($$field)) {
				throw new Q_Exception_RequiredField(compact($field));
			}
		}
		Users::canManageContacts($asUserId, $userId, $label, true);
		$contact = new Users_Contact();
		$contact->userId = $userId;
		$contact->label = $label;
		$contact->contactUserId = $contactUserId;
		if (!$contact->retrieve()) {
			throw new Q_Exception_MissingRow(array(
				'table' => 'Users_Contact',
				'criteria' => Q::json_encode($contact->fields)
			));
		}
		if (isset($updates['nickname'])) {
			$contact->nickname = $updates['nickname'];
		}
		$contact->save();
		return $contact;
	}
	
	/**
	 * Remove contact from label
	 * @method removeContact
	 * @static
	 * @param {string} $userId
	 * @param {string} $label
	 * @param {string} $contactId
	 * @param {string} [$asUserId=null] The user to do this operation as.
	 *   Defaults to the logged-in user. Pass false to skip access checks.
	 * @throws {Users_Exception_NotAuthorized}
	 * @return {Db_Query_Mysql}
	 */
	static function removeContact($userId, $label, $contactId, $asUserId = null)
	{
		foreach (array('userId', 'label', 'contactUserId') as $field) {
			if (empty($$field)) {
				throw new Q_Exception_RequiredField(compact($field));
			}
		}
		Users::canManageContacts($asUserId, $userId, $label, $contactId, true);
		$contact = new Users_Contact();
		$contact->userId = $userId;
		$contact->label = $label;
		$contact->contactUserId = $contactId;
		return $contact->remove();
	}

	/**
	 * Retrieve contacts belonging to label
	 * @method fetch
	 * @static
	 * @param {string} $userId
	 * @param {string|Db_Range|Db_Expression} $label
	 * @param {array} [$options=array()] Query options including:
	 * @param {integer} [$options.limit=false]
	 * @param {integer} [$options.offset]
	 * @return {array}
	 */
	static function fetch($userId, $label = null, /* string|Db_Range, */ $options = array())
	{
		if (empty($userId)) {
			throw new Q_Exception_RequiredField(array('field' => $userId));
		}
		$limit = isset($options['limit']) ? $options['limit'] : false;
		$offset = isset($options['offset']) ? $options['offset'] : 0;
		
		$criteria = compact('userId');
		
		if ($label) {
			if (is_string($label) and substr($label, -1) === '/') {
				$label = new Db_Range($label, true, false, true);
			}
			$criteria['label'] = $label;
		}

		$query = Users_Contact::select('*')->where($criteria);
		if ($limit) {
			$query = $query->limit($limit, $offset);
		}
		return $query->fetchDbRows();
	}
	
	/**
	 * Check if a contact with this label exists
	 * @method checkLabel
	 * @static
	 * @param {string} $userId
	 * @param {string} $label
	 * @param {string} $contactId
	 * @return {Db_Row|false}
	 */
	static function checkLabel($userId, $label, $contactId)
	{
		if (!$userId or !$contactId) {
			return null;
		}
		if ($userId instanceof Users_User) {
			$userId = $userId->id;
		}
		if ($contactId instanceof Users_User) {
			$contactId = $contactId->id;
		}
		$contact = new Users_Contact();
		$contact->userId = $userId;
		$contact->label = $label;
		$contact->contactUserId = $contactId;
		return $contact->retrieve();
	}

	/* * * */
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Users_Contact} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Users_Contact();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};