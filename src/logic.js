
// high level logic routines

const {px} = require('./util.js');
const {seq} = require('./util.js');
const {wait} = require('./util.js');
const {Keyboard} = require('./io.js');
const {coords, feats, colors, gds} = require('./ngu.js');

class Logic {
	constructor() {
		this.inv = new InvLogic( this );
		this.adv = new AdvLogic( this );
		this.gd = new GdLogic( this );
		this.ngu = new NguLogic( this );
	}

	getRidOfMouse() {
		return nguJs.io.mouse.move( px(-1000,-1000) );
	}

	toFeat( feature ) {
		const {mouse} = nguJs.io;
		mouse.move( coords.feat.buttons[feature].center );
		mouse.click();
	}

	queryPixel( pixelColor, baseObj ) {
		const base = baseObj ?
			baseObj.rect.topLeft :
			px(0,0);

		const color = nguJs.io.framebuffer.getPixel( base.clone().add(pixelColor.offset) );
		return pixelColor.get( color );
	}
}

class FeatureLogic {
	constructor( feature, logic ) {
		this.feature = feature;
		this.logic = logic;
	}

	goTo() { return this.logic.toFeat( this.feature ); }
}

class NguLogic extends FeatureLogic {
	constructor( logic ) {
		super( feats.ngu, logic );
	}
	async activateENgu( row ) {
		const {mouse} = nguJs.io;
		mouse.move(coords.ngu.plus(row));
		mouse.click();
		await wait(0.25);
	}
	async activateMNgu( row ) {
		const {mouse} = nguJs.io;
		mouse.move(coords.ngu.page);
		mouse.click();
		await wait(0.25);
		mouse.move(coords.ngu.plus(row));
		mouse.click();
		await wait(0.25);
	}
}

class GdLogic extends FeatureLogic {
	constructor( logic ) {
		super( feats.gd, logic );
	}
	clearDiggers() {
		const {mouse} = nguJs.io;
		mouse.move( coords.gd.clear.center );
		mouse.click();
	}
	async activateDigger( digger ) {
		const {mouse} = nguJs.io;
		mouse.move(coords.gd[gds[digger][0]].center);
		mouse.click();
		await wait(0.25);
		mouse.move(coords.gd[gds[digger][1]]);
		mouse.click();
		await wait(0.25);
	}
	async activateDiggers( diggers ) {
		for (const digger of diggers) {
			await this.activateDigger(digger);
		}
	}
}

class InvLogic extends FeatureLogic {
	constructor( logic ) {
		super( feats.inv, logic );
	}
	merge() { return nguJs.io.keyboard.press( Keyboard.keys.d ); }
	mergeSlot( slot ) {
		const {mouse} = nguJs.io;
		mouse.move( slot.px );
		this.merge();
	}
	mergeAllSlots() {
		for( let slot of coords.inv.pageSlots ) {
			this.mergeSlot( slot );
		};
	}
	//mergeEquip
	//mergeAll
	applyAllBoostsToCube() {
		const {mouse} = nguJs.io;
		mouse.move( coords.inv.equip.cube.center );
		mouse.click( 2 );
	}

	applyBoostToSlot( slot ) {
		const {mouse} = nguJs.io;
		mouse.move( coords.inv.slot(slot % 12, Math.floor(slot / 12)).center );
		nguJs.io.keyboard.press( Keyboard.keys.a );
	}

	applyBoostToEquip( slot ) {
		const {mouse} = nguJs.io;
		mouse.move( coords.inv.equip[slot].center );
		nguJs.io.keyboard.press( Keyboard.keys.a );
	}

	applyMergeToSlot( slot ) {
		const {mouse} = nguJs.io;
		mouse.move( coords.inv.slot(slot % 12, Math.floor(slot / 12)).center );
		nguJs.io.keyboard.press( Keyboard.keys.d );
	}

	applyMergeToEquip( slot ) {
		const {mouse} = nguJs.io;
		mouse.move( coords.inv.equip[slot].center );
		nguJs.io.keyboard.press( Keyboard.keys.d );
	}

	async loadout( num ) {
		nguJs.io.keyboard.press( Keyboard.keys.r );
		await wait(0.25);
		nguJs.io.keyboard.press( Keyboard.keys.t );
		await wait(0.25);
		const {mouse} = nguJs.io;
		mouse.move( coords.inv.loadout["l" + num] );
		mouse.click();
		await wait(0.25);
	}
}


class AdvLogic extends FeatureLogic {
	constructor( logic ) {
		super( feats.adv, logic );
	}

	getMovesInfo() {
		const {logic} = this;
		const {moveActive, moveState} = colors.adv;
		const moveObj = coords.adv.moves.move;

		const result = {};

		for( let name in moveObj ) {
			const move = moveObj[name];
			const active = logic.queryPixel( moveActive, move );
			const state = logic.queryPixel( moveState, move );
			result[name] = {active, state, ready:(state===`ready` && !active) };
		}

		return result;
	}
	isEnemyAlive() { return this.logic.queryPixel( colors.adv.enemyAlive ); }
	isBoss() { return this.logic.queryPixel( colors.adv.boss ); }

	setAtkIdle(isIdle) {
		if (isIdle != this.logic.queryPixel( colors.adv.atkIdle ))
			nguJs.io.keyboard.press( Keyboard.keys.q );
	}

	hpRatioIsAtLeast( ratio ) {
		return this.logic.queryPixel( colors.adv.ownHpRatioAtLeast(ratio) );
	}

	prevArea() { return nguJs.io.keyboard.press( Keyboard.keys.leftArrow ); }
	nextArea() { return nguJs.io.keyboard.press( Keyboard.keys.rightArrow ); }
	attack( move ) {
		// TODO(peoro): let's use key shortcuts instead of moving mouse back and forth D:
		const {mouse} = nguJs.io;
		mouse.move( move.px );
		mouse.click();
		this.logic.getRidOfMouse();
	}
}

Object.assign( module.exports, {Logic} );
