import { Character } from './character';
import { Position } from '../character-properties/position.interface';
import { SpriteDict } from '../character-properties/sprite-dict.interface';
import { CharacterAssetType } from '../../store/types/asset-types.type';

export class Justin extends Character {
    public image: HTMLImageElement;
    public imageAttacking: HTMLImageElement;
    public imageWinning: HTMLImageElement;
    public spriteDict: SpriteDict;
    public timeforAttackAnimation: number;
    public characterType: CharacterAssetType;

    constructor(
        gameWidth: number,
        gameHeight: number,
        name: string,
        pos: Position,
        id: number,
        assets: HTMLImageElement[],
        ctx: CanvasRenderingContext2D
    ) {
        super(gameWidth, gameHeight, name, pos, id, assets, ctx);

        this.image = this.assets[0];
        this.imageAttacking = this.assets[1];
        this.imageWinning = this.assets[0];
        this.characterType = 'justin';

        // custom column/row coords from sprite sheet
        this.spriteDict = {
            running: [
                [0, 2],
                [3, 2],
            ],
            knockedBack: [
                [0, 3],
                [5, 3],
            ],
            attacking: [
                [0, 1],
                [7, 1],
            ],
            winning: [
                [2, 4],
                [6, 4],
            ],
            dead: [
                [0, 3],
                [5, 3],
            ],
            waiting: [
                [0, 0],
                [4, 0],
            ],
        };

        // time needed for animation to attack
        // catches error if time is  < 0
        this.timeforAttackAnimation =
            (this.attackCD -
                (this.spriteDict['attacking'][1][0] -
                    this.spriteDict['attacking'][0][0]) *
                    this.imageTimerMax) *
            0.5;
        if (this.timeforAttackAnimation <= 0) {
            console.log('ERROR 0 for timeForAttackAnimation');
        }
    }
}
