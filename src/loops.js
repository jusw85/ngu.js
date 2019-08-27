
// high level strategies

const {timeSec, withTimeout} = require('./util.js');
const ngu = require('./ngu.js');

class LoopRunner {
	constructor() {
		this.currentRule = null;
		this.shouldStop = false;
	}

	// TODO(peoro): move `sync` outside of `loops`...
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

	loops( nguJs ) {
		const {logic, io} = nguJs;

		return {
			fixInv: this.mkRule( `fix inventory`, async function() {
				logic.inv.goTo();
				logic.inv.applyAllBoostsToCube();

				for( let slot of ngu.inv.inventory ) {
					logic.inv.mergeSlot( slot );
					await this.sync();
				};
			}),

			snipeBoss: this.mkRule( `snipe boss`, async function() {
				logic.adv.goTo();
				logic.getRidOfMouse();

				let bossFound = false;
				let lastEnemyTime = timeSec();

				while( true ) {
					await this.sync( true ); // making sure that the pixel we're using are fresh

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
						// hmm... I'm probably dead and back to safe zone :(
						console.log( `Am I... Dead?! D:` );
						return;
					}

					if( isEnemyAlive && ! isBoss ) {
						console.log( `!boss: skipping` );
						logic.adv.prevArea();
						logic.adv.nextArea();
						continue;
					}

					const move = logic.adv.chooseMove();
					if( move ) {
						console.log( `Using move`, move );
						move.rect.debug( .75 );
						logic.adv.attack( move );
					}
				}
			}),

			killAll: this.mkRule( `kill all`, async function() {
				logic.adv.goTo();
				logic.getRidOfMouse();

				let lastEnemyTime = timeSec();

				while( true ) {

					try {
						await this.sync( true ); // making sure that the pixel we're using are fresh
					}
					catch( err ) {
						// if we need to stop, let's enable idle before stopping
						const moveInfo = logic.adv.getMovesInfo();
						if( ! moveInfo.idle.active ) {
							logic.adv.attack( ngu.adv.moves.idle );
						}

						throw err;
					}

					const isEnemyAlive = logic.adv.isEnemyAlive();

					const now = timeSec();
					if( isEnemyAlive ) { lastEnemyTime = now }

					if( now - lastEnemyTime > 10 ) {
						// hmm... I'm probably dead and back to safe zone :(
						console.log( `Am I... Dead?! D:` );
						return;
					}

					const move = logic.adv.chooseMove();
					if( move ) {
						console.log( `Using move`, move );
						move.rect.debug( .75 );
						logic.adv.attack( move );
					}
				}
			}),

			snipeLoop: this.mkRule( `snipe and fix inventory`, async function(){
				await nguJs.loops.fixInv.fn.apply( this );
				await nguJs.loops.snipeBoss.fn.apply( this );
			}),

			killAllLoop: this.mkRule( `kill all and fix inventory`, async function(){
				await nguJs.loops.fixInv.fn.apply( this );

				// TODO(peoro): oh god @,@ it's unreal how hacky this stuff got...
				// we really really need to start using behavior trees or something
				const killAllP = nguJs.loops.killAll.fn.apply(this);
				await withTimeout( killAllP, 30 ) // running `killAll` AND a timer
					.catch( async (err)=>{
						if( err === `stop` ) { return; } // `killAll` failed (stop was requested

						// timer failed
						console.assert( err === `Timeout on a promise after 30s` );
						this.shouldStop = true; // then, to stop `killAll`, we set this var
						await killAllP.catch( ()=>{} ); // we wait for `killAll` to finish, ignoring its `stop` error
						this.shouldStop = false; // and reset this var so that WE don't stop DDD:
					});

				/*
				// enabling back idle, so we keep killing while sorting out the inventory :3
				const moveInfo = logic.adv.getMovesInfo();
				if( ! moveInfo.idle.active ) {
					logic.adv.attack( ngu.adv.moves.idle );
				}
				*/
			}),

		};
	}
}

module.exports = {
	LoopRunner,
};
