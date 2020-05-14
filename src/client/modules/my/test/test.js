import { LightningElement, api } from 'lwc';

const tests = [
    'Hello',
    'Bonjour',
    '你好',
    'Hola',
    'Привет',
    'こんにちは',
    'Guten Tag',
    'ጤና ይስጥልኝ',
    'Ciao',
    'नमस्ते',
    '안녕하세요'
];
const SPEED_CLASS_MAP = {
    slow: 'fade-slow',
    fast: 'fade-fast',
    medium: 'fade-medium'
};
const DEFAULT_SPEED = 'medium';

export default class Test extends LightningElement {
    animationSpeed = DEFAULT_SPEED;
    index = 0;
    isAnimating = true;

    @api
    set speed(value) {
        if (SPEED_CLASS_MAP[value]) {
            this.animationSpeed = value;
        } else {
            this.animationSpeed = DEFAULT_SPEED;
        }
        this.isAnimating = true;
    }

    // Return the internal speed property
    get speed() {
        return this.animationSpeed;
    }

    // Get the current greeting
    get test() {
        return tests[this.index];
    }

    // Map slow, medium, fast to CSS Animations
    get animationClass() {
        if (this.isAnimating) {
            return SPEED_CLASS_MAP[this.speed];
        }
        return 'hide';
    }

    //Handle the animation ending, update to next hello
    handleAnimationEnd() {
        this.isAnimating = false;
        this.index = (this.index + 1) % tests.length;

        setTimeout(() => this.updateTest(), 500);
    }

    // Update to the next greeting and start animating
    updateTest() {
        this.isAnimating = true;
    }
}
