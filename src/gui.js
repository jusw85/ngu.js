const {implementTyping} = require('./fixes.js');

class Gui {
	constructor( nguJs ) {
		this.nguJs = nguJs;

		const {div} = nguJs.ui;

		// events received on this widget shouldn't propagate to the canvas beneath
		div.addEventListener( `mousemove`, (e)=>{ e.stopPropagation(); });
		div.addEventListener( `mousedown`, (e)=>{ e.stopPropagation(); });
		div.addEventListener( `mouseup`, (e)=>{ e.stopPropagation(); });

		const nguJsButton = document.createElement('button');
		nguJsButton.textContent = `.js`;
		const style = nguJsButton.style;
		{
			style.position = `absolute`;
			style.left = `11px`;
			style.top = `558px`;
			style.width = `38px`;
			style.height = `30px`;
			style.pointerEvents = `auto`;
			style.boxSizing = `border-box`;
			style.backgroundColor = `white`;
			style.borderRadius = `5px`;
			style.border = `2px solid black`;
			style.zIndex = 10000;
			div.appendChild( nguJsButton );
		}

		var _this = this;
		this.config = null;
		const controlDiv = document.createElement('div');
		{
			const style = controlDiv.style;
			style.visibility = `hidden`;
			style.position = `absolute`;
			style.left = `11px`;
			style.top = `42px`;
			style.width = `880px`;
			style.height = `546px`;
			style.pointerEvents = `auto`;
			style.boxSizing = `border-box`;
			style.backgroundColor = `white`;
			style.borderRadius = `5px`;
			style.border = `2px solid black`;
			style.opacity = .95;
			style.padding = `10px`;
			style.zIndex = 5000;

			const currentLoopP = document.createElement('p');
			{
				currentLoopP.textContent = `Current loop: `
				const currentLoopSpan = document.createElement('span');
				{
					currentLoopSpan.textContent = `none`;
					div.addEventListener( `nguJs.loop`, (e)=>{
						currentLoopSpan.textContent = e.detail || `none`;
					});
					currentLoopP.appendChild( currentLoopSpan );
				}
			}

			const stopA = document.createElement('a');
			{
				stopA.textContent = `Stop loop`;
				stopA.href = `javascript:void nguJs.loopRunner.stop();`;
				stopA.style.display = `block`;
			}

			const stopIntervalA = document.createElement('a');
			{
				const a = stopIntervalA;
				a.textContent = `Stop interval`;
				a.href = `javascript:void(0)`;
				a.onclick = function() {
					nguJs.loopRunner.stopInterval();
				}
				a.style.display = `block`;
			}

			const mergeAndBoostA = document.createElement('a');
			{
				const a = mergeAndBoostA;
				a.textContent = `Merge and boost`;
				a.href = `javascript:void(0)`;
				a.onclick = function() {
					nguJs.loops.mergeAndBoost(_this.config["merge"], _this.config["boost"]);
				}
				a.style.display = `block`;
			}

			const snipeAndBoostA = document.createElement('a');
			{
				const a = snipeAndBoostA;
				a.textContent = `Snipe and boost`;
				a.href = `javascript:void(0)`;
				a.onclick = function() {
					nguJs.loops.snipeAndBoost(_this.config["boost"], _this.config.itopodSnipe.num);
				}
				a.style.display = `block`;
			}

			const killBossOnlyA = document.createElement('a');
			{
				const a = killBossOnlyA;
				a.textContent = `Kill boss only`;
				a.href = `javascript:void(0)`;
				a.onclick = function() {
					nguJs.loops.killBossOnly();
				}
				a.style.display = `block`;
			}

			const applyBoostA = document.createElement('a');
			{
				const a = applyBoostA;
				a.textContent = `Apply boosts`;
				a.href = `javascript:void(0)`;
				a.onclick = function() {
					// nguJs.loops.applyBoosts(["weap", 0, 1, "cube"]);
					// nguJs.loops.applyBoosts(eval(document.getElementById("applyBoostInput").value));
					nguJs.loops.applyBoosts(_this.config["boost"]);
				}
				a.style.display = `block`;
			}

			const applyMergeA = document.createElement('a');
			{
				const a = applyMergeA;
				a.textContent = `Apply merges`;
				a.href = `javascript:void(0)`;
				a.onclick = function() {
					nguJs.loops.applyMerges(_this.config["merge"]);
				}
				a.style.display = `block`;
			}

			const applyNguA = document.createElement('a');
			{
				const a = applyNguA;
				a.textContent = `Apply ngu`;
				a.href = `javascript:void(0)`;
				a.onclick = function() {
					nguJs.loops.applyNgu(_this.config["ngu"], 250, {times:1});
				}
				a.style.display = `block`;
				controlDiv.appendChild( a );
			}

			const textAreaA = document.createElement('textarea');
			{
				const ta = textAreaA
				ta.value =
`{
  "boost": ["weap", "cube"],
  "merge": [0,1,2,3,"weap"],
  "ngu": [0,0],
  "loadouts": {
    "gold": {"lo": 1, "digger": ["drop","xp","pp","adv","ebrd"]},
    "drop": {"lo": 2, "digger": ["drop","xp","pp","adv","ebrd"]},
    "pp": {"lo": 3, "digger": ["xp","pp","dc","mngu","adv"]}
  },
  "itopodSnipe": {
    "num": 10
  },
  "snipeAndBoost": {
    "intervalMin": 180,
    "preWait": 45,
    "wait1": 55,
    "wait2": 50,
    "lo1": "drop",
    "lo2": "pp",
    "lof": "gold"
  }
}`;
				ta.cols = 80;
				ta.rows = 6;
				ta.style.display = `block`;
				ta.id = "config";
				this.config = JSON.parse(ta.value);
			}
			implementTyping(textAreaA);

			const loadoutDropdownA = document.createElement('select');
			{
				const a = loadoutDropdownA;
				a.style.display = `block`;
				a.id = "lo-dropdown";
			}

			function refreshLoadoutDropdown() {
				var s = loadoutDropdownA;
				for(let i = s.options.length - 1 ; i >= 0 ; i--) {
					s.remove(i);
				}
				for (var key in _this.config["loadouts"]) {
					var opt = document.createElement("option"); 
					opt.text = key;
					opt.value = key;
					s.options.add(opt);
				}
			}

			const refreshConfigA = document.createElement('a');
			{
				const a = refreshConfigA;
				a.textContent = `Refresh Config`;
				a.href = `javascript:void(0)`;
				a.onclick = function() {
					_this.config = JSON.parse(document.getElementById("config").value);
					refreshLoadoutDropdown();
				}
				a.style.display = `block`;
			}

			const toloadoutA = document.createElement('a');
			{
				const a = toloadoutA;
				a.textContent = `Apply loadout`;
				a.href = `javascript:void(0)`;
				a.onclick = function() {
					var idx = document.getElementById("lo-dropdown").value;
					var loidx = _this.config.loadouts[idx].lo;
					var digger = _this.config.loadouts[idx].digger;
					nguJs.loops.toLoadout(loidx, digger, 250, {times:1});
				}
				a.style.display = `block`;
			}

			const capAllMagicA = document.createElement('a');
			{
				const a = capAllMagicA;
				a.textContent = `Cap All Magic`;
				a.href = `javascript:void(0)`;
				a.onclick = function() {
					nguJs.loops.capAllMagic(250, {times:1});
				}
				a.style.display = `block`;
			}

			const capWandoosA = document.createElement('a');
			{
				const a = capWandoosA;
				a.textContent = `Cap Wandoos`;
				a.href = `javascript:void(0)`;
				a.onclick = function() {
					nguJs.loops.capWandoos(250, {times:1});
				}
				a.style.display = `block`;
			}

			controlDiv.appendChild(textAreaA);
			controlDiv.appendChild(refreshConfigA);
			controlDiv.appendChild(document.createElement("br"));
			controlDiv.appendChild(currentLoopP);
			controlDiv.appendChild(stopA);
			controlDiv.appendChild(document.createElement("br"));
			controlDiv.appendChild(applyBoostA);
			controlDiv.appendChild(applyMergeA);
			controlDiv.appendChild(mergeAndBoostA);
			controlDiv.appendChild(snipeAndBoostA);
			controlDiv.appendChild(killBossOnlyA);
			controlDiv.appendChild(document.createElement("br"));
			controlDiv.appendChild(loadoutDropdownA);
			controlDiv.appendChild(toloadoutA);
			controlDiv.appendChild(applyNguA);
			controlDiv.appendChild(capAllMagicA);
			controlDiv.appendChild(capWandoosA);
			controlDiv.appendChild(document.createElement("br"));
			controlDiv.appendChild(stopIntervalA);
			refreshLoadoutDropdown();

			// const applyAllA = document.createElement('a');
			// {
			// 	const a = applyAllA;
			// 	a.textContent = `Fix inventory`;
			// 	a.href = `javascript:void nguJs.loops.fixInv();`;
			// 	a.style.display = `block`;
			// 	controlDiv.appendChild( a );
			// }

			// const fightA = document.createElement('a');
			// {
			// 	const a = fightA;
			// 	a.textContent = `Snipe boss`;
			// 	a.href = `javascript:void nguJs.loops.snipeBoss();`;
			// 	a.style.display = `block`;
			// 	controlDiv.appendChild( a );
			// }

			// const mainLoopA = document.createElement('a');
			// {
			// 	const a = mainLoopA;
			// 	a.textContent = `Snipe bosses and fix inventory`;
			// 	a.href = `javascript:void nguJs.loops.mainLoop();`;
			// 	a.style.display = `block`;
			// 	controlDiv.appendChild( a );
			// }

			div.appendChild( controlDiv );
		}

		div.addEventListener( `mouseenter`, ()=>{ controlDiv.style.visibility = `visible`; } );
		div.addEventListener( `mouseleave`, ()=>{ controlDiv.style.visibility = `hidden`; } );
	}
}

Object.assign( module.exports, {
	Gui,
});
