
// high level strategies

const {timeSec, wait} = require('./util.js');
const {coords, feats} = require('./ngu.js');
const {Keyboard} = require('./io.js');

class LoopRunner {
	constructor() {
		this.currentRule = null;
		this.shouldStop = false;

		this.myinterval = null;
		this.mytimeout = null;
	}

	async sync( nextFrame ) {
		// waiting until next frame
		if( nextFrame ) { await nguJs.io.nextFrame; }

		// waiting until all input events have been processed
		await nguJs.io.sync();

		// stopping
		if( this.shouldStop ) { throw `stop`; }
	}
	async runRule( ruleName, fn ) {
		console.assert( ! this.currentRule, `Trying to start ${ruleName} while ${this.currentRule
		} is running` );

		this.currentRule = ruleName;
		this.shouldStop = false;
		nguJs.ui.div.dispatchEvent( new CustomEvent(`nguJs.loop`, {detail:ruleName}) );
		try {
			await fn();
		} catch( err ) {
			if( err !== `stop` ) {
				console.error( err );
				throw err;
			}
		} finally {
			this.currentRule = null;
			nguJs.ui.div.dispatchEvent( new CustomEvent(`nguJs.loop`) );
		}
	}
	mkRule( ruleName, fn ) {
		const loop = async (...args )=>{
			await this.stop();

			const opts = args.length > 0 ? args[ args.length-1 ] : {};
			const times = opts.times || Infinity;
			const pause = opts.pause || 0;

			await this.runRule( ruleName, async ()=>{
				for( let i = 0; i < times; ++i ) {
					await fn.apply( this, args );
					await this.sync( true ); // waiting for all input to be processed
				}
			});
		};
		loop.fn = fn;
		return loop;
	}
	awaitRule() {
		return new Promise( (resolve, reject)=>
			nguJs.ui.div.addEventListener( `nguJs.loop`, resolve, {once:true} )
		);
	}
	async stop() {
		if( this.currentRule ) {
			this.shouldStop = true;
			await this.awaitRule();
			this.shouldStop = false;
			console.assert( !this.currentRule, `Rule didn't stop...` );
		}
	}

	mystop() {
		if( this.myinterval ) {
			console.log("stopping interval");
			clearInterval(this.myinterval);
		}
		if( this.mytimeout ) {
			console.log("stopping timeout");
			clearTimeout(this.mytimeout);
		}
	}

	loops( nguJs ) {
		const {logic, io, loopRunner} = nguJs;

		return {
			test: async function(mytime) {
				mytime = mytime.split(":");
				var min = parseInt(mytime[0]);
				var sec = parseInt(mytime[1]);
				// var timeleft = (((59 - min - 1) * 60) + (60 - sec) + 15) * 1000; 
				var timeleft = ((min * 60) + sec - 45) * 1000;
				console.log(timeleft);

				var fn = async function() {
					console.log(new Date());
					console.log("running fn");
					await loopRunner.stop();
					await nguJs.loops.toDrop(250, {times:1});
					await nguJs.loops.applyNgu(eval(document.getElementById("applyNguInput").value), 250, {times:1})
					logic.inv.goTo();
					console.log("waiting for drop");
					await wait(55);
					console.log("drop done");
					await nguJs.loops.toPp(250, {times:1});
					await wait(60);
					await nguJs.loops.applyNgu(eval(document.getElementById("applyNguInput").value), 250, {times:1})
					logic.inv.goTo();
					// nguJs.loops.applyBoosts(eval(document.getElementById("applyBoostInput").value));
					nguJs.loops.mainLoop3(eval(document.getElementById("applyBoostInput").value), 10);
					console.log("done");
				}
				var start = function() {
					console.log("setting interval");
					loopRunner.myinterval = setInterval(fn, 60 * 60 * 1000);
					fn();
				}
				loopRunner.mytimeout = setTimeout(start, timeleft);
				// var timeNow = new Date().getTime();
			},

			applyNgu: this.mkRule( `apply ngu`, async function(slots, delay=250, opts={}) {
				logic.ngu.goTo();
				await wait(delay / 1000);
				await logic.ngu.activateENgu(slots[0]);
				await logic.ngu.activateMNgu(slots[1]);
			}),

			toDrop: this.mkRule( `to drop`, async function(delay=250, opts={}) {
				logic.inv.goTo();
				await wait(delay / 1000);
				await logic.inv.loadout(2);

				logic.gd.goTo();
				await wait(delay / 1000);
				logic.gd.clearDiggers();
				await wait(delay / 1000);
				await logic.gd.activateDiggers(["drop","adv","pp","dc"]);
			}),

			toNgu: this.mkRule( `to ngu`, async function(delay=250, opts={}) {
				logic.inv.goTo();
				await wait(delay / 1000);
				await logic.inv.loadout(1);

				logic.gd.goTo();
				await wait(delay / 1000);
				logic.gd.clearDiggers();
				await wait(delay / 1000);
				await logic.gd.activateDiggers(["adv","engu","mngu","ebrd"]);
			}),


			toPp: this.mkRule( `to pp`, async function(delay=250, opts={}) {
				logic.inv.goTo();
				await wait(delay / 1000);
				await logic.inv.loadout(3);

				logic.gd.goTo();
				await wait(delay / 1000);
				logic.gd.clearDiggers();
				await wait(delay / 1000);
				await logic.gd.activateDiggers(["adv","pp","dc","ebrd"]);
			}),

			applyBoosts: this.mkRule( `apply boosts`, async function(slots, timeout=10000, delay=250) {
				for (const slot of slots) {
					if (slot === "cube") {
						logic.inv.applyAllBoostsToCube();
					} else if (typeof slot === "number") {
						logic.inv.applyBoostToSlot(slot)
					} else {
						logic.inv.applyBoostToEquip(slot)
					}
					await new Promise(resolve => setTimeout(resolve, delay));
				}
				await new Promise(resolve => setTimeout(resolve, timeout));
			}),

			applyMerges: this.mkRule( `apply merges`, async function(slots, timeout=10000, delay=250) {
				for (const slot of slots) {
					if (slot === "cube") {
						logic.inv.applyAllBoostsToCube();
					} else if (typeof slot === "number") {
						logic.inv.applyMergeToSlot(slot)
					} else {
						logic.inv.applyMergeToEquip(slot)
					}
					await new Promise(resolve => setTimeout(resolve, delay));
				}
				await new Promise(resolve => setTimeout(resolve, timeout));
			}),

			itopodSnipe: this.mkRule( `itopod snipe`, async function(num=3, timeout=10000, delay=250) {
				logic.adv.goTo();
				logic.getRidOfMouse();
				await new Promise(resolve => setTimeout(resolve, 500));
				logic.adv.setAtkIdle(false);
				for (let i = 0; i < num; i++) {
					await new Promise(resolve => setTimeout(resolve, 800));
					while (!logic.adv.isEnemyAlive()) {
						await new Promise(resolve => setTimeout(resolve, 10));
					}
					nguJs.io.keyboard.press( Keyboard.keys.w );
				}
				logic.adv.setAtkIdle(true);
			}),

			mainLoop3: this.mkRule( `mainloop3`, async function(slot, num=3, timeout=10000, delay=250){
				await nguJs.loops.itopodSnipe.fn.call( this, num );
				// await new Promise(resolve => setTimeout(resolve, 800));
				logic.inv.goTo();
				await nguJs.loops.applyBoosts.fn.call( this, slot, 100, delay );
			}),

			mainLoop2: this.mkRule( `mainloop2`, async function(slots, slot2, timeout=10000, delay=250){
				await nguJs.loops.applyMerges.fn.call( this, slots, 1000, delay );
				await nguJs.loops.applyBoosts.fn.call( this, slot2, timeout, delay );
			}),

			fixInv: this.mkRule( `fix inventory`, async function() {
				logic.inv.goTo();
				logic.inv.applyAllBoostsToCube();
				logic.inv.mergeAllSlots();
			}),

			snipeBoss: this.mkRule( `snipe boss`, async function() {
				logic.adv.goTo();

				const {move} = coords.adv.moves;

				let bossFound = false;
				let lastEnemyTime = timeSec();

				while( true ) {
					await this.sync( true ); // making sure that the pixel we're using are fresh

					const moveInfo = logic.adv.getMovesInfo();
					const isBoss = logic.adv.isBoss();
					const isEnemyAlive = logic.adv.isEnemyAlive();

					const now = timeSec();
					if( isEnemyAlive ) { lastEnemyTime = now; }
					bossFound = bossFound || ( isEnemyAlive && isBoss );

					if( bossFound && ! isEnemyAlive ) {
						console.log( `done killing the boss!` );
						return;
					}

					if( now - lastEnemyTime > 10 ) {
						// hmm... I'm probably dead :(
						console.log( `Am I... Dead?! D:` );
						return;
					}

					const chosenMove = (()=>{
						if( moveInfo.idle.active ) {
							console.log( `disabling idle attack` );
							return move.idle;
						}

						if( isEnemyAlive && ! isBoss ) {
							console.log( `!boss: skipping` );
							logic.adv.prevArea();
							logic.adv.nextArea();
							return;
						}

						const reallyNeedHeal = ! logic.adv.hpRatioIsAtLeast( .5 );
						if( reallyNeedHeal ) {
							console.log( `need urgent heal!` );
							if( moveInfo.defBuff.ready ) { return move.defBuff; }
							if( moveInfo.heal.ready ) { return move.heal; }
							if( moveInfo.regen.ready ) { return move.regen; }
						}

						if( ! isEnemyAlive ) {
							const needHeal = ! logic.adv.hpRatioIsAtLeast( .8 );
							if( needHeal ) {
								if( moveInfo.heal.ready ) { return move.heal; }
								if( moveInfo.regen.ready ) { return move.regen; }
							}
							if( moveInfo.parry.ready ) { return move.parry; }
							return;
						}

						// actual fighting
						if( moveInfo.ultimate.ready && (moveInfo.charge.ready || moveInfo.charge.active) ) {
							if( moveInfo.offBuff.ready ) { return move.offBuff; }
							if( moveInfo.ultBuff.ready ) { return move.ultBuff; }
							if( moveInfo.charge.ready ) { return move.charge; }
						}
						if( moveInfo.ultimate.ready ) { return move.ultimate; }
						if( moveInfo.piercing.ready ) { return move.piercing; }
						if( moveInfo.strong.ready ) { return move.strong; }
						if( moveInfo.regular.ready ) { return move.regular; }

						// console.log( `no attack ready` );
					})();

					if( chosenMove ) {
						console.log( `Using move`, chosenMove.name );
						logic.adv.attack( chosenMove );
					}
				}
			}),

			mainLoop: this.mkRule( `snipe and fix inventory`, async function(){
				await nguJs.loops.fixInv.fn.apply( this );
				await nguJs.loops.snipeBoss.fn.apply( this );
			}),

		};
	}
}

module.exports = {
	LoopRunner,
};
