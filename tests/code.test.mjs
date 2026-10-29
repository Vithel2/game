import assert from 'node:assert/strict';
import {fresh,redeemCode,unlimitedBalance} from '../game/state.js';
import {buyUpgrade} from '../game/tech-shop.js';
const s=fresh();assert.equal(redeemCode(s,'bad'),false);assert.equal(s.money,3500);assert.ok(redeemCode(s,' VMCT '));s.pc.owned=true;assert.ok(buyUpgrade(s,'ram'));s.money-=999999999;assert.equal(s.money,Number.MAX_SAFE_INTEGER);const loaded=unlimitedBalance(JSON.parse(JSON.stringify(s)));assert.ok(loaded.unlimitedMoney);assert.ok(buyUpgrade(loaded,'gpu'));assert.equal(loaded.money,Number.MAX_SAFE_INTEGER);assert.equal(fresh().unlimitedMoney,undefined);console.log('PASS: invalid/valid codes, purchases, JSON save persistence, new game reset');
