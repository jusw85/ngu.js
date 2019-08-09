
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

		// const test = document.createElement('input');
		// test.type = `text`;
		// test.value = `"hello world"`;
		// document.body.appendChild(test)
		// const style2 = test.style;
		// {
		// 	style2.position = `absolute`;
		// 	style2.left = `11px`;
		// 	style2.top = `11px`;
		// 	style2.width = `100px`;
		// 	style2.height = `30px`;
		// 	style2.zIndex = 10000;
		// 	style2.pointerEvents = `auto`;

		// 	test.oninput = function(e) {
		// 		console.log("keydown");
		// 	}
		// 	test.onkeypress = function(evt) {
		// 		// console.log("keypress");
		// 		console.log(evt);
		// 		// evt.stopPropagation();
		// 	    // evt = evt || window.event;
		// 	    // if (typeof evt.stopPropagation != "undefined") {
		// 	    //     evt.stopPropagation();
		// 	    // } else {
		// 	    //     evt.cancelBubble = true;
		// 	    // }
		// 	};

		// 	// test.onkeydown = function(evt) {
		// 	//         // evt.stopPropagation();
		// 	//     // evt = evt || window.event;
		// 	//     // if (typeof evt.stopPropagation != "undefined") {
		// 	//     //     evt.stopPropagation();
		// 	//     // } else {
		// 	//     //     evt.cancelBubble = true;
		// 	//     // }
		// 	// };

		// 	// test.onkeyup = function(evt) {
		// 	//         // evt.stopPropagation();
		// 	//     // evt = evt || window.event;
		// 	//     // if (typeof evt.stopPropagation != "undefined") {
		// 	//     //     evt.stopPropagation();
		// 	//     // } else {
		// 	//     //     evt.cancelBubble = true;
		// 	//     // }
		// 	// };
		// 	// div.appendChild( test );
		// }

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
				controlDiv.appendChild( currentLoopP );
			}

			const stopA = document.createElement('a');
			{
				stopA.textContent = `Stop loop`;
				stopA.href = `javascript:void nguJs.loopRunner.stop();`;
				stopA.style.display = `block`;
				controlDiv.appendChild( stopA );
			}

			const inputApplyBoostA = document.createElement('input');
			{
				const input = inputApplyBoostA
				input.type = `text`;
				input.value = `[0,"weap", "cube"]`;
				input.style.display = `block`;
				input.id = "applyBoostInput"
				controlDiv.appendChild( input );
			}

			const applyBoostA = document.createElement('a');
			{
				const a = applyBoostA;
				a.textContent = `Apply boosts`;
				a.href = `javascript:void(0)`;
				a.onclick = function() {
					// nguJs.loops.applyBoosts(["weap", 0, 1, "cube"]);
					nguJs.loops.applyBoosts(eval(document.getElementById("applyBoostInput").value));
				}
				a.style.display = `block`;
				controlDiv.appendChild( a );
			}

			const toDropA = document.createElement('a');
			{
				const a = toDropA;
				a.textContent = `To Drop`;
				a.href = `javascript:void(0)`;
				a.onclick = function() {
					nguJs.loops.toDrop(250, {times:1});
				}
				a.style.display = `block`;
				controlDiv.appendChild( a );
			}

			const toNguA = document.createElement('a');
			{
				const a = toNguA;
				a.textContent = `To Ngu`;
				a.href = `javascript:void(0)`;
				a.onclick = function() {
					nguJs.loops.toNgu(250, {times:1});
				}
				a.style.display = `block`;
				controlDiv.appendChild( a );
			}

			const inputNgu = document.createElement('input');
			{
				const input = inputNgu
				input.type = `text`;
				input.value = `[0, 0]`;
				input.style.display = `block`;
				input.id = "applyNguInput"
				controlDiv.appendChild( input );
			}

			const applyNgu = document.createElement('a');
			{
				const a = applyNgu;
				a.textContent = `Apply Ngu`;
				a.href = `javascript:void(0)`;
				a.onclick = function() {
					nguJs.loops.applyNgu(eval(document.getElementById("applyNguInput").value), 250, {times:1})
				}
				a.style.display = `block`;
				controlDiv.appendChild( a );
			}

			const mystop = document.createElement('a');
			{
				const a = mystop;
				a.textContent = `Stop Interval`;
				a.href = `javascript:void(0)`;
				a.onclick = function() {
					nguJs.loopRunner.mystop();
				}
				a.style.display = `block`;
				controlDiv.appendChild( a );
			}

			const inputApplyMergeA = document.createElement('input');
			{
				const input = inputApplyMergeA
				input.type = `text`;
				input.value = `[0,1,2,3,"weap"]`;
				input.style.display = `block`;
				input.id = "applyMergeInput"
				controlDiv.appendChild( input );
			}

			const applyMergeA = document.createElement('a');
			{
				const a = applyMergeA;
				a.textContent = `Apply merges`;
				a.href = `javascript:void(0)`;
				a.onclick = function() {
					// nguJs.loops.applyBoosts(["weap", 0, 1, "cube"]);
					nguJs.loops.applyMerges(eval(document.getElementById("applyMergeInput").value));
				}
				a.style.display = `block`;
				controlDiv.appendChild( a );
			}

			const mainLoopA = document.createElement('a');
			{
				const a = mainLoopA;
				a.textContent = `Mainloop2`;
				a.href = `javascript:void(0)`;
				a.onclick = function() {
					// nguJs.loops.applyBoosts(["weap", 0, 1, "cube"]);
					nguJs.loops.mainLoop2(eval(document.getElementById("applyMergeInput").value), eval(document.getElementById("applyBoostInput").value));
				}
				a.style.display = `block`;
				controlDiv.appendChild( a );
			}

			const mainLoop3A = document.createElement('a');
			{
				const a = mainLoop3A;
				a.textContent = `Mainloop3`;
				a.href = `javascript:void(0)`;
				a.onclick = function() {
					nguJs.loops.mainLoop3(eval(document.getElementById("applyBoostInput").value), 10);
				}
				a.style.display = `block`;
				controlDiv.appendChild( a );
			}

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
