
const {px, rectS} = require('./util.js');
const {loadNguJs} = require('./loader.js');
const {implementTyping} = require('./fixes.js');
const {imageDataToURL, hash} = require('./util.js');
const {ImageView, ImageDataView} = require('./image.js');
const assets = require('./assets.js');
const {IO} = require('./io.js');

const noop = ()=>{};
function createElement( parent, tag, opts={}, fn=noop, appendChild=true ) {
	if( fn === noop && typeof opts === "function" ) {
		fn = opts;
		opts = {};
	}

	const el = document.createElement( tag );
	Object.assign( el, opts );
	fn( el );
	if (appendChild) {
		parent.appendChild( el );
	}
	return el;
}
function createTextNode( parent, text ) {
	parent.appendChild( document.createTextNode(text) );
}
function clearElement( el ) {
	while( el.firstChild ) {
		el.removeChild( el.firstChild );
	}
}

function reloadLoadoutDropdown( loadoutselect ) {
	var s = loadoutselect;
	for(let i = s.options.length - 1 ; i >= 0 ; i--) {
		s.remove(i);
	}
	for (var key in Gui.config["loadouts"]) {
		var opt = document.createElement("option");
		opt.text = key;
		opt.value = key;
		s.options.add(opt);
	}
}

function loadConfig( config ) {
	IO.delay = config.inputdelay;
	Gui.config = config;
}

const defaultConfig =
`{
  "inputdelay": 0,
  "boostSlots": {
    "slots": ["acc4",0,1,"head","weapon","cube"],
    "interval": 5000
  },
  "mergeSlots": {
    "slots": ["chest","legs","shoes"],
    "interval": 5000
  },
  "inventory": {
    "comment": "can be array of inv slot (0 to 59), or bool - quest=rightClick",
    "merge": true,
    "boost": [],
    "quest": false
  },
  "killAll": {
    "killTimer": 10000
  },
  "loadouts": {
    "farming": {
      "loadoutNumber": 1,
      "diggerFn": "capSaved"
    },
    "drop": {
      "loadoutNumber": 2,
      "diggers": ["drop","engu","mngu","adv","dayc"],
      "diggerFn": "cap"
    },
    "ygg": {
      "loadoutNumber": 5,
      "diggers": ["drop","xp","pp","adv","dayc"],
      "diggerFn": "toggle"
    }
  }
}`;

function isJsonValid(str) {
	try {
		JSON.parse(str);
	} catch (e) {
		return false;
	}
	return true;
}

class Gui {
	constructor( nguJs ) {
		this.nguJs = nguJs;

		const {div} = nguJs.ui;

		createElement( div, `button`, {textContent:`.js`, className:`ngu-js-button`} );

		createElement( div, `div`, {className:`ngu-js-window`, tabIndex:0}, (controlDiv)=>{
			// this div hides as soon as the mouse leaves NGU.js GUI
			controlDiv.style.visibility = `hidden`;
			const show = ()=>{
				controlDiv.style.visibility = `visible`;
				controlDiv.focus();
			};
			const hide = ()=>{ controlDiv.style.visibility = `hidden`; };

			div.addEventListener( `mouseenter`, show );
			div.addEventListener( `mouseleave`, hide );
			div.addEventListener( `keydown`, (event)=>{
				if( event.key === `Escape` ) { hide(); }
			});

			// let's add a `dev` logo, if necessary
			if( process.env.DEV ) {
				createElement( controlDiv, `span`, {className:`dev`, textContent:`dev`} );
			}

			createElement( controlDiv, `div`, {className:`content`}, (contentDiv)=>{
				const loadoutselect = createElement( contentDiv, `select`, {id: "loadout-select"}, noop, false );
				const textArea = createElement( contentDiv, `textArea`, {cols:80, rows:6, id:"config"}, implementTyping);
				{
					textArea.style.display = `block`;
					textArea.value = localStorage.getItem('nguJsConfig') || defaultConfig;
					const config = JSON.parse(textArea.value);
					loadConfig( config );
					reloadLoadoutDropdown( loadoutselect );
				}

				const setConfig = createElement(contentDiv, `a`, {textContent:`Set config`, href:`javascript:void(0)`});
				{
					setConfig.onclick = function() {
						const configStr = document.getElementById("config").value;
						if (!isJsonValid(configStr)) {
							alert('Malformed JSON config');
							return false;
						}
						const config = JSON.parse(configStr);
						loadConfig( config );
						reloadLoadoutDropdown( loadoutselect );
					}
				}
				createTextNode(contentDiv, ", ");
				const saveConfig = createElement(contentDiv, `a`, {textContent:`Save config`, href:`javascript:void(0)`});
				{
					saveConfig.onclick = function() {
						const configStr = document.getElementById("config").value;
						if (!isJsonValid(configStr)) {
							alert('Malformed JSON config');
							return false;
						}
						localStorage.setItem('nguJsConfig', configStr);
					}
				}
				createTextNode(contentDiv, ", ");
				const loadConfigEl = createElement(contentDiv, `a`, {textContent:`Load config`, href:`javascript:void(0)`});
				{
					loadConfigEl.onclick = function() {
						document.getElementById("config").value = localStorage.getItem('nguJsConfig') || defaultConfig;
					}
				}
				createTextNode(contentDiv, ", ");
				const defaultConfigEl = createElement(contentDiv, `a`, {textContent:`Default config`, href:`javascript:void(0)`});
				{
					defaultConfigEl.onclick = function() {
						document.getElementById("config").value = defaultConfig;
					}
				}
				createElement( contentDiv, `br`);
				createElement( contentDiv, `br`);

				// let's display what's the loop currently active (and a button to disable it)
				createElement( contentDiv, `p`, (p)=>{
					createTextNode( p, `Current loop: ` );

					createElement( p, `span`, {textContent:`none`}, (span)=>{
						div.addEventListener( `nguJs.loop`, (e)=>{
							span.textContent = e.detail || `none`;
							stopSpan.style.visibility = e.detail ? `inherit` : `hidden`;
						});
					});

					const stopSpan = createElement( p, `span`, (stopSpan)=>{
						stopSpan.style.visibility = `hidden`;

						createTextNode( stopSpan, ` — ` );
						createElement( stopSpan, `a`, {textContent:`stop`, href:`javascript:void nguJs.loopRunner.stop();`} );
					});
				});

				// loop buttons
				const mkA = (textContent, fn, classname=`loop`)=>{
					createElement( contentDiv, `a`, {className:classname, href:`javascript:void 0;`, textContent}, (a)=>{
						// TODO(peoro): place a single event listener on the whole `contentDiv` that routes events
						a.addEventListener( `click`, fn );
					});
				};

				mkA( `Boost slots`, ()=>{ const cfg = Gui.config; nguJs.loops.applyBoostToSlots(cfg.boostSlots.slots, cfg.boostSlots.interval); }, `loop-inline` );
				createTextNode(contentDiv, ", ");
				mkA( `Merge slots`, ()=>{ const cfg = Gui.config; nguJs.loops.applyMergeToSlots(cfg.mergeSlots.slots, cfg.mergeSlots.interval); }, `loop-inline` );
				createTextNode(contentDiv, ", ");
				mkA( `Merge then boost slots`, ()=>{ const cfg = Gui.config; nguJs.loops.applyMergeBoostToSlots(cfg.mergeSlots.slots, cfg.boostSlots.slots, 1000, cfg.mergeSlots.interval); }, `loop-inline` );
				createTextNode(contentDiv, ", ");
				mkA( `Kill merge boost`, ()=>{ const cfg = Gui.config; nguJs.loops.killMergeBoostLoop(cfg.mergeSlots.slots, cfg.boostSlots.slots, 0, 0, cfg.killAll.killTimer); }, `loop-inline` );
				createElement( contentDiv, `br`);
				contentDiv.appendChild(loadoutselect);
				mkA( `Switch loadout`, ()=>{
					const cfg = Gui.config;
					const idx = loadoutselect.value;
					const loadoutIdx = cfg.loadouts[idx].loadoutNumber - 1;
					const diggers = cfg.loadouts[idx].diggers;
					const diggerFn = cfg.loadouts[idx].diggerFn;
					nguJs.loops.toLoadout(loadoutIdx, diggers, diggerFn, {times:1});
				}, `loop-inline` );

				mkA( `Merge everything`, ()=>{ nguJs.loops.fixInv(); } );
				mkA( `Snipe boss`, ()=>{ nguJs.loops.snipeBoss(); } );
				mkA( `Snipe boss and merge everything`, ()=>{ nguJs.loops.snipeLoop(); } );
				mkA( `Kill all`, ()=>{ nguJs.loops.killAll(); } );
				mkA( `Kill all and merge everything`, ()=>{ nguJs.loops.killAllLoop(); } );
				mkA( `Kill all plus (uses cfg.killTimer.killTimer, cfg.inventory.*)`, ()=>{
					const cfg = Gui.config;
					nguJs.loops.killAllLoopPlus( cfg.inventory, Math.round(cfg.killAll.killTimer/1000) );
				} );
				mkA( `Fetch item lookup table`, async ()=>{
					const {logic, io, loopRunner} = nguJs;
					const {ngu} = nguJsLib;
					const {pages} = ngu.itemList;

					await loopRunner.stop();
					logic.inv.goTo();
					logic.click( ngu.inv.feats.itemList );
					logic.click( ngu.itemList.clear );
					logic.click( ngu.itemList.clearDialog.yes );

					clearElement( invDiv );

					for( let i = 0; i < pages.length; ++i ) {
						logic.click( pages[i] );
						await loopRunner.sync( true );

						nguJsLib.ngu.itemList.items.forEach( (slot)=>{
							const imgData = new ImageView( nguJs.io.framebuffer, slot.innerRect ).toImageData();
							createElement( invDiv, `a`, {download:`x.png`, href:imageDataToURL(imgData)}, a=>{
								createElement( a, `img`, {
									src: imageDataToURL(imgData),
									title: assets.items.detect(imgData.data),
									imgData,
								});
							});
						});
					}
				});

				mkA( `Compute item lookup table`, ()=>{
					const {missing, count, hashItemListImg} = assets.items;

					const imgs = Array.from( invDiv.childNodes );
					const hashes = imgs.map( hashItemListImg );
					console.assert( hashes.slice(0, count).every( (hash)=>hash !== missing) );
					console.assert( hashes.slice(count).every( (hash)=>hash === missing) );

					const items = hashes.slice( 0, count );
					console.log( JSON.stringify(items, null, `\t`) );
					console.log( `Unknown: "${hashes[hashes.length-1]}"` );
					assets.items.items.splice( 0, items.length, ...items );
				});

				mkA( `Get slot items`, async ()=>{
					nguJs.logic.inv.goTo();
					await nguJs.loopRunner.sync( true );

					clearElement( invDiv );
					nguJsLib.ngu.inv.inventory.forEach( (slot)=>{
						const imgData = new ImageView( nguJs.io.framebuffer, slot.innerRect ).toImageData();
						createElement( invDiv, `img`, {
							src: imageDataToURL(imgData),
							title: assets.items.detect(imgData.data),
							imgData,
						});
					});
				});

				mkA( `Cube to PNG`, async ()=>{
					nguJs.logic.inv.goTo();
					await nguJs.loopRunner.sync( true );

					const imgData = new ImageView( nguJs.io.framebuffer, nguJsLib.ngu.inv.cube.innerRect ).toImageData();
					const png = assets.items.toPNG( imgData );
				});

				mkA( `Item list to PNG`, async ()=>{
					const {logic, io, loopRunner} = nguJs;
					const {ngu} = nguJsLib;
					const {pages} = ngu.itemList;

					const itemSize = nguJsLib.ngu.itemList.items[0].innerRect.size;
					const pageCount = ngu.grids.inventory.itemList.items.count;
					console.log( `${itemSize}x${pageCount}x${pages.length}` );

					await loopRunner.stop();
					logic.inv.goTo();
					logic.click( ngu.inv.feats.itemList );
					logic.click( ngu.itemList.clear );
					logic.click( ngu.itemList.clearDialog.yes );

					clearElement( invDiv );

					for( let i = 0; i < pages.length; ++i ) {
						logic.click( pages[i] );
						await loopRunner.sync( true );

						const targetSize = itemSize.clone().multiply(pageCount);
						const targetImgData = new ImageData( targetSize.x, targetSize.y );
						const targetView = new ImageDataView( targetImgData );

						console.log( `Target: ${targetSize}` );

						nguJsLib.ngu.itemList.items.forEach( (slot, i)=>{
							const src = new ImageView( nguJs.io.framebuffer, slot.innerRect );

							const targetPos = px( i%pageCount.x, Math.floor(i/pageCount.x) );
							const targetRect = rectS( targetPos.multiply(itemSize), itemSize );
							const target = new ImageView( targetView, targetRect );

							console.log( `${slot.innerRect} => ${targetRect}` );

							src.copyTo( target );
						});

						createElement( invDiv, `img`, {
							src: imageDataToURL(targetImgData),
						});
					}
				});

				createElement( contentDiv, `br`);
				mkA( `Cap all magic`, ()=>{
					nguJs.loops.capAllMagic({times: 1});
				});
				mkA( `Cap all wandoos`, ()=>{
					nguJs.loops.capAllWandoos({times: 1});
				});

				//const invDiv = createElement( contentDiv, `div` );
				// TODO: debugging only: let's reuse the same invDiv among reloads...
				const invDiv = window.invDiv =
					( window.invDiv && (contentDiv.appendChild(window.invDiv), window.invDiv) ) ||
					createElement( contentDiv, `div` );
			});

			// reload NGU.js form
			createElement( controlDiv, `form`, {className:`reload`}, (form)=>{
				const input = createElement( form, `input`, {type:`text`, placeholder:localStorage.getItem('nguJsBasePath')}, implementTyping );

				createElement( form, `button`, {type:`submit`, textContent:`reload`} );

				form.addEventListener( `submit`, (event)=>{
					const value = input.value || input.placeholder;

					console.log( `Reloading`, value );
					loadNguJs( value );

					event.preventDefault();
					return false;
				});
			});
		});
	}
}

Object.assign( module.exports, {
	Gui,
});
