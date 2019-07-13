
// high level strategies

const {wait} = require('./util.js');
const {coords, feats} = require('./ngu.js');

class LoopRunner {
	constructor() {
		this.currentRule = null;
		this.shouldStop = false;
	}

	async wait( s=.03 ) {
		while( s >= 0 ) {
			if( this.shouldStop ) { throw `stop`; }
			await wait( Math.min(s, 1) );
			s -= 1;
		}
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
		return (args)=>{
			return this.runRule( `mergeLoop`, ()=>fn.apply(this, args) );
		};
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
		const {logic} = nguJs;

		return {
			mergeLoop: this.mkRule( `mergeLoop`, async function( {pause=5}={} ) {
				while( true ) {
					await nguJs.focus(); // focus lost if you click outside the game
					await logic.inv.goTo();
					await this.wait();
					await logic.inv.applyAllBoostsToCube();
					await this.wait();
					await logic.inv.mergeAllSlots();
					await this.wait( pause );
				}
			}),
		};
	}
}

module.exports = {
	LoopRunner,
};