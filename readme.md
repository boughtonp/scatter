Scatter

* Version:       0.1
* License:       LGPLv3
* Homepage:      https://www.sorcerersisle.com/software/scatter
* Documentation: https://docs.sorcerersisle.com/scatter
* Repository:    https://github.com/boughtonp/scatter.git
* Issues:        https://github.com/boughtonp/scatter/issues


Description
-----------

Scatter is a JavaScript library for randomly arranging HTML elements within a
containing element.

The main use case is an image gallery, but the library does not restrict what
it can be used for - it can provide a scattered polaroid photo effect as easily
as using decorative images to provide a randomized background, or any other
reasons for scattering items your imagination can come up with.

The demos directory provides various examples showing how to achieve different
effects. For further detail on how Scatter works, check the docs directory.


Requirements
------------

Scatter is designed to work in any modern browser, without any dependencies.

Older browsers (released before 2015) can be supported with polyfills for 
Object.assign and Array.from - adding these allows Scatter to work with 
Internet Explorer 11.0.9600, and possibly Firefox 3.6

With a polyfill for Element.classList it may work as far back as IE9, but this
has not been tested, and is not specifically supported.


Licensing & Credits
-------------------

This project is available under the terms of the LGPLv3 license.
See license.txt to understand your rights and obligations.

Scatter was created by Peter Boughton.


Contributing
------------

This project aims to adhere to the philosophy "do one thing well", and also to
keep the core script simple and understandable.

Fixes, simplifications, and improvements to existing functionality are welcome.
Additional features or larger changes are not a priority.

If in doubt, raise an issue to discuss first.


/eof