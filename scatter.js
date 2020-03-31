// Scatter v0.1 | (c) Peter Boughton | License: LGPLv3 | Website: https://www.sorcerersisle.com/software/scatter
"use strict";

var Scatter = function()
{

	var DefaultOptions =
		{ Mode            : 'radial'
		, InitialMode     : void 0
		, InitialSelect   : -1
		, SelectedClass   : 'selected'
		, SelectedScale   : 1.5
		, Scale           : 1.0
		, MaxRotation     : 10
		, Shuffle         : 'auto'
		, ShuffleModes    : ['random','radial']
		, ContainerEvents : { 'click' : 'arrange' }
		, ChildEvents     : { 'click' : 'select' }

		// Mode-specific options
		, GridAlignCenter    : true
		, GridSpacing        : 1
		, GridSpacingX       : void 0
		, GridSpacingY       : void 0
		, PileOffsetFactor   : 3
		, RadialWidthFactor  : 0.85
		, RadialHeightFactor : 1.2
		, RadialMinDistance  : 0.5
		, FixedRelativeTo    : 'center'
		, FixedPositions     : void 0
		};

	var Scatter = function Scatter( Target , InitOptions )
	{
		var Instance = this;
		var Container;
		var Options = {};
		var Positions = [];
		var SelectedIndex;


		Instance.configure = function( NewOptions )
			{
				if ( typeof NewOptions !== 'object' )
					throw new TypeError('Invalid argument');

				Options = resolveOptions( Options , NewOptions );
			};


		Instance.arrange = function( Mode , Reset )
			{
				if ( typeof Mode === 'undefined' || typeof Mode === 'object' )
					Mode = Options.Mode;

				Positions = choosePositions( Mode , Container , Options , Positions );

				if ( ( typeof Reset !== 'boolean' || Reset ) && typeof SelectedIndex !== 'undefined' )
					Container.children[SelectedIndex].classList.remove(Options.SelectedClass);

				if ( Positions.length !== Container.children.length )
					throw new Error('Found '+Container.children.length+' children; have '+Positions.length+' positions');

				for ( var i=0 ; i<Container.children.length ; ++i )
					translateCenter( Container.children[i] , Positions[i] , Options.Scale );
			};


		Instance.select = function( Index )
			{
				if ( typeof Index !== 'number' )
				{
					if ( Index.stopPropagation )
						Index.stopPropagation();

					Index = Array.prototype.indexOf.call( Container.children , Index.currentTarget || Index );
				}

				if ( typeof Index !== 'number' )
					throw new Error('Invalid Index');

				if ( typeof SelectedIndex !== 'undefined' )
				{
					if ( SelectedIndex === Index )
						return;

					Instance.discard();
				}

				if ( Index < 0 || Index >= Container.children.length )
					throw new Error('Index out of bounds ('+Index+' not within 0..'+Container.children.length+')');

				SelectedIndex = Index;
				translateCenter( Container.children[Index] , getCenterCoords(Container) , Options.SelectedScale );
				Container.children[Index].style.zIndex = getHighestZ(Container)+1;
				Container.children[Index].classList.add(Options.SelectedClass);
			};


		Instance.discard = function( Reset )
			{
				if (typeof SelectedIndex === 'undefined')
					return;

				Container.children[SelectedIndex].classList.remove(Options.SelectedClass);
				translateCenter( Container.children[SelectedIndex] , Positions[SelectedIndex] , Options.Scale );

				if ( typeof Reset !== 'boolean' || Reset )
					SelectedIndex = undefined;
			};


		Instance.prev = function()
			{
				if ( typeof SelectedIndex === 'undefined' || SelectedIndex === 0 )
					return Instance.select(Container.children.length-1);

				return Instance.select(SelectedIndex-1);
			};


		Instance.next = function()
			{
				if ( typeof SelectedIndex === 'undefined' || SelectedIndex === Container.children.length-1 )
					return Instance.select(0);

				return Instance.select(SelectedIndex+1);
			};


		Container = getContainer( Target );

		Options = resolveOptions( DefaultOptions , InitOptions );

		prepareElements( Container , Options , this );

		if ( typeof Options.InitialMode !== 'undefined' )
			Instance.arrange(Options.InitialMode);

		if ( Options.InitialSelect !== -1)
			Instance.select(Options.InitialSelect);
	}


	function getContainer( Target )
	{
		if ( typeof Target === 'object' && Target.nodeType == Node.ELEMENT_NODE )
			return Target;

		if ( typeof Target !== 'string' )
			throw new Error('Invalid Target, expected Element or Selector');

		var TargetElement = document.querySelector(Target);
		
		if ( TargetElement === null )
			throw new Error('Selector ['+Target+'] did not match.');

		return TargetElement;
	}


	function resolveOptions( Current , New )
	{
		var Result = {};

		Object.assign( Result , Current );

		for ( var CurOpt in New )
		{
			Result[CurOpt] = ( typeof Result[CurOpt] === 'object' && ! Result[CurOpt] instanceof Array )
				? resolveOptions(Result[CurOpt],New[CurOpt])
				: New[CurOpt]
				;
		}

		if ( Result.Mode === 'fixed' && ! Result.FixedPositions instanceof Array )
			throw new Error('Invalid Options, Mode "fixed" requires array of FixedPositions');

		return Result;
	}


	function prepareElements( Container , Options , Instance )
	{
		if ( getComputedStyle(Container).position == 'static' )
			Container.style.position = 'relative';

		var ContainerCenter = getCenterCoords(Container);

		for ( var i=0 ; i<Container.children.length ; ++i )
		{
			Container.children[i].style.position = 'absolute';
			positionCenter( Container.children[i] , ContainerCenter , Options.Scale );

			for ( var CurType in Options.ChildEvents )
			{
				var CurListener = Options.ChildEvents[CurType];
				Container.children[i].addEventListener
					( CurType
					, (typeof CurListener === 'string') ? Instance[ CurListener ] : CurListener
					);
			}
		}

		for ( var CurType in Options.ContainerEvents )
		{
			var CurListener = Options.ContainerEvents[CurType];
			Container.addEventListener
				( CurType
				, (typeof CurListener === 'string') ? Instance[ CurListener ] : CurListener
				);
		}
	}


	function getCenterCoords( Element )
	{
		var c = getDocumentPosition(Element);
		return { left:c.left+c.width/2 , top:c.top+c.height/2 , angle:0 };
	}


	function positionCenter( Element , Pos , Scale )
	{
		var ParentPos = getDocumentPosition(Element.parentElement);

		Element.style.left = (Pos.left - ParentPos.left - Element.offsetWidth/2) + 'px';
		Element.style.top  = (Pos.top - ParentPos.top - Element.offsetHeight/2) + 'px';
		Element.style.transform = 'scale('+Scale+')';
	}


	function translateCenter( Element , Pos , Scale )
	{
		var ParentPos = getDocumentPosition(Element.parentElement);

		var x = (Pos.left - ParentPos.left - Element.offsetWidth/2) + 'px';
		var y = (Pos.top - ParentPos.top - Element.offsetHeight/2) + 'px';

		Element.style.left = '0px';
		Element.style.top  = '0px';
		Element.style.transform = 'translate('+x+','+y+') rotate('+Pos.angle+'deg) scale('+Scale+')';
	}


	function choosePositions ( Mode , Container , Options , Positions )
	{
		if ( Container.children.length === 0 )
			throw new RangeError('No children');

		if ( typeof Mode === 'undefined' || typeof Mode === 'object' )
			Mode = Options.Mode;

		var Result = [];

		var Bounds = getDocumentPosition(Container);

		if ( Mode === 'fixed' )
		{
			if ( ! Options.FixedPositions instanceof Array )
				throw new TypeError('Missing or invalid FixedPositions option');

			// Accept 2/3 item array, or object with named keys...
			var k = ( Options.FixedPositions[0] instanceof Array )
				? [0,1,2] : ['left','top','angle']
				;

			for ( var i=0 ; i<Options.FixedPositions.length ; ++i )
			{
				var CurPos =
					{ left  : Options.FixedPositions[i][k[0]] + Bounds.left
					, top   : Options.FixedPositions[i][k[1]] + Bounds.top
					, angle : Options.FixedPositions[i][k[2]] || 0
					};

				if ( Options.FixedRelativeTo == 'center' )
				{
					CurPos.left += Bounds.width/2;
					CurPos.top += Bounds.height/2;
				}
				Result.push(CurPos);
			}

			if ( typeof Options.Shuffle === 'boolean' ? Options.Shuffle : ( Options.ShuffleModes.indexOf(Mode) !== -1 ) )
				shuffle(Result);

			return Result;
		}

		if ( Mode === 'radial' )
		{
			var ContainerCenter = getCenterCoords(Container);
			var WidthRatio  = (Bounds.width/Bounds.height)*Options.RadialWidthFactor;
			var HeightRatio = (Bounds.height/Bounds.width)*Options.RadialHeightFactor;
		}
		else if ( Mode === 'grid' )
		{
			var AspectRatio = Bounds.width/Bounds.height;
			var MaxPerRow = Container.children.length / AspectRatio;
			var ColIndex = 0;
			var CellSize =
				{ X : Container.children[0].offsetWidth * Options.Scale
				, Y : Container.children[0].offsetHeight * Options.Scale
				};
			var CurLeft = CellSize.X/2;
			var CurTop = -CellSize.Y/2 - (Options.GridSpacingY||Options.GridSpacing);
			var MaxRight=0;
			var MaxBottom=0;
		}

		for ( var Index=0 ; Index < Container.children.length ; ++Index )
		{
			switch (Mode)
			{
				case 'center':
				case 'stack':
				case 'pile':
					Result[Index] =
						{ left  : Bounds.left + Bounds.width/2
						, top   : Bounds.top + Bounds.height/2
						, angle : 0
						};

					if ( Mode !== 'center' )
					{
						Result[Index].angle = getRandomOffset(Options.MaxRotation);
					}

					if ( Mode == 'pile' )
					{
						var ItemRadius =
							{ X : Container.children[Index].offsetWidth/2 * Options.Scale
							, Y : Container.children[Index].offsetHeight/2 * Options.Scale
							};

						Result[Index].left += getRandomOffset(ItemRadius.X/Options.PileOffsetFactor);
						Result[Index].top  += getRandomOffset(ItemRadius.Y/Options.PileOffsetFactor);
					}
				break;

				case 'random':
					Result[Index] =
						{ left  : Bounds.left + Math.random()*Bounds.width
						, top   : Bounds.top + Math.random()*Bounds.height
						, angle : getRandomOffset(Options.MaxRotation)
						};
				break;

				case 'radial':
					var Angle  = 2*Math.PI * (Index / Container.children.length);
					var Distance = Math.max(Options.RadialMinDistance,Math.random())* Math.min(Bounds.width,Bounds.height)/2;

					Result[Index] =
						{ left  : ContainerCenter.left + (Math.cos(Angle)*Distance*WidthRatio)
						, top   : ContainerCenter.top  + (Math.sin(Angle)*Distance*HeightRatio)
						, angle : getRandomOffset(Options.MaxRotation)
						};
				break;

				case 'grid':
					CurLeft += Container.children[Index].offsetWidth * Options.Scale;

					if ( CurLeft+CellSize.X > Bounds.width || ColIndex > MaxPerRow || Index === 0 )
					{
						MaxRight = CurLeft-CellSize.X/2;
						CurLeft = CellSize.X/2;
						CurTop += CellSize.Y + (Options.GridSpacingY||Options.GridSpacing);
						ColIndex = 0;
						MaxBottom = CurTop+CellSize.Y/2;
					}
					else
					{
						++ColIndex;
						CurLeft += (Options.GridSpacingX||Options.GridSpacing);
					}

					Result[Index] =
						{ left  : Bounds.left + CurLeft
						, top   : Bounds.top  + CurTop
						, angle : getRandomOffset(Options.MaxRotation)
						};
				break;

				default:
					throw new Error('Unknown Mode option ['+Options.Mode+']');
				break;
			}
		}

		if ( Mode === 'grid' && Options.GridAlignCenter )
		{
			for ( var Index = 0 ; Index < Result.length ; ++Index )
			{
				Result[Index].left += (Bounds.width-MaxRight)/2;
				Result[Index].top  += (Bounds.height-MaxBottom)/2;
			}
		}

		if ( typeof Options.Shuffle === 'boolean' ? Options.Shuffle : ( Options.ShuffleModes.indexOf(Mode) !== -1 ) )
			shuffle(Result);

		return Result;
	}


	function getDocumentPosition(Element)
	{
		var r1 = Element.getBoundingClientRect();
		var r2 = document.documentElement.getBoundingClientRect();

		var Result = {};

		for ( var key in r1 )
			Result[key] = r1[key];

		Result.left   -= r2.left;
		Result.right  -= r2.left;
		Result.top    -= r2.top;
		Result.bottom -= r2.top;

		return Result;
	}


	function getHighestZ(Element)
	{
		return Math.max.apply
			( null
			, Array.from
				( Element.children
				, function(Child){ return getComputedStyle(Child)['z-index']/1||0; }
				)
			);
	}


	function getRandomOffset(Limit)
	{
		return (Math.random()*Limit*2) - Limit;
	}


	function shuffle( Collection )
	{
		// Fisher-Yates shuffle algorithm
		for ( var OldIndex = Collection.length-1 ; OldIndex > 0 ; --OldIndex )
		{
			var NewIndex = Math.floor( Math.random() * (OldIndex+1) );
			var Swap = Collection[OldIndex];
			Collection[OldIndex] = Collection[NewIndex];
			Collection[NewIndex] = Swap;
		}
	}


	return Scatter;
}();