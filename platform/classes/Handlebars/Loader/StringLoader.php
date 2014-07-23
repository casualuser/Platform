<?php
/**
 * Handlebars Template string Loader implementation.
 *
 * @category  Xamin
 * @package   Handlebars
 * @author    fzerorubigd <fzerorubigd@gmail.com>
 * @author    Behrooz Shabani <everplays@gmail.com>
 * @author    Mardix <https://github.com/mardix>
 * @copyright 2012 (c) ParsPooyesh Co
 * @copyright 2013 (c) Behrooz Shabani
 * @copyright 2013 (c) Mardix
 * @license   MIT
 * @link      http://voodoophp.org/docs/handlebars
 */

class Handlebars_StringLoader implements Handlebars_Loader
{

    /**
     * Load a Template by source.
     *
     * @param string $name Handlebars Template source
     *
     * @return String Handlebars Template source
     */
    public function load($name)
    {
        return new Handlebars_String($name);
    }

}
