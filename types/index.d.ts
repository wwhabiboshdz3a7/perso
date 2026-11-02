// Types de Kinetika 0.1.0, écrits à la main.
// https://github.com/wwhabiboshdz3a7/kinetika · MIT © 2026 wwhabiboshdz3a7

/* —————————————————————————————— Cibles et valeurs —————————————————————————————— */

/** Sélecteur CSS, élément, liste d'éléments, objet JS, ou tableau mêlant tout cela. */
export type Targets = string | Element | NodeList | HTMLCollection | object | ArrayLike<string | Element | object> | null | undefined;

/** Fonction appelée pour chaque cible : (cible, index, nombre de cibles). */
export type FunctionValue<T> = (target: any, index: number, total: number) => T;

/** Valeur simple : nombre, chaîne avec unité, couleur, valeur relative ('+=100', '*=2'…). */
export type Primitive = number | string;

/** Fonction d'easing : progression en temps (0 → 1) vers progression de la valeur. */
export interface EasingFunction {
  (t: number): number;
}

/** Easing paramétrable de la famille `eases` : `eases.outElastic.with(1, .4)`. */
export interface NamedEasing extends EasingFunction {
  with(...params: number[]): EasingFunction;
}

/** Ressort physique : la durée de stabilisation est calculée. */
export interface SpringEasing extends EasingFunction {
  /** Durée nécessaire pour se stabiliser, en ms. */
  readonly duration: number;
  readonly isSpring: true;
  readonly params: Required<SpringParams>;
}

export type EasingName =
  | 'linear'
  | `${'in' | 'out' | 'inOut' | 'outIn'}${'Quad' | 'Cubic' | 'Quart' | 'Quint' | 'Sine' | 'Expo' | 'Circ' | 'Back' | 'Elastic' | 'Bounce'}`
  | 'in' | 'out' | 'inOut' | 'outIn';

/** Nom, chaîne paramétrée ('outElastic(1, .5)', 'cubicBezier(…)', 'steps(4)', 'spring(1, 100, 10)', alias anime.js / GSAP / CSS) ou fonction. */
export type Ease = EasingName | (string & {}) | EasingFunction;

/** Valeur d'easing acceptée dans les paramètres : courbe, ou fonction (cible, i, total) qui choisit une courbe. */
export type EaseParam = Ease | ((target: any, index: number, total: number) => Ease);

/** Étape de keyframes détaillée ou paramètres propres à une propriété. */
export interface PropertyStep {
  to?: Primitive | FunctionValue<Primitive>;
  /** Synonyme de `to`. */
  value?: Primitive | FunctionValue<Primitive>;
  from?: Primitive | FunctionValue<Primitive>;
  duration?: number | FunctionValue<number>;
  delay?: number | FunctionValue<number>;
  ease?: EaseParam;
  modifier?: (value: number) => number;
}

/** Valeur d'une propriété animée. */
export type PropertyValue =
  | Primitive
  | FunctionValue<Primitive | Primitive[]>
  | Primitive[]
  | PropertyStep
  | PropertyStep[]
  | CustomValue;

/** Valeur calculée à partir de la progression (renvoyée par `motionPath()`). */
export interface CustomValue {
  readonly unit: string;
}

/* —————————————————————————————— Paramètres —————————————————————————————— */

export type Callback<T> = (self: T) => void;

/** Paramètres de lecture communs aux animations et aux timelines. */
export interface PlaybackParams<T> {
  /** Délai avant le départ, en ms (ne se rejoue pas à chaque boucle). */
  delay?: number | FunctionValue<number>;
  /** Répétitions supplémentaires ; `true` pour une boucle infinie. */
  loop?: number | boolean;
  /** Pause entre deux itérations, en ms. */
  loopDelay?: number;
  /** Aller-retour. */
  alternate?: boolean;
  /** Démarre en sens inverse. */
  reversed?: boolean;
  /** `false` pour lancer plus tard ; `onScroll(…)` pour lier au défilement. */
  autoplay?: boolean | ScrollObserver;
  /** Vitesse de lecture. */
  speed?: number;
  /** `false` : ignore la préférence « mouvement réduit ». */
  reducedMotion?: boolean;
  id?: string;
  onBegin?: Callback<T>;
  onUpdate?: Callback<T>;
  onLoop?: Callback<T>;
  onComplete?: Callback<T>;
  onPause?: Callback<T>;
}

export interface AnimationOptions extends PlaybackParams<Animation> {
  /** Durée en ms (par défaut 1000, ou celle du ressort). */
  duration?: number | FunctionValue<number>;
  ease?: EaseParam;
  /** Keyframes : tableau d'états ou objet de pourcentages ('0%', '50%', 'from', 'to'). */
  keyframes?: Array<Record<string, any>> | Record<string, Record<string, any>>;
  /** 'replace' (par défaut) : reprend la main sur une propriété déjà animée. */
  composition?: 'replace' | 'none';
  /** Transforme chaque valeur numérique avant écriture. */
  modifier?: (value: number) => number;
  /** Attributs animés explicitement. */
  attr?: Record<string, PropertyValue>;
}

/** Transformations individuelles. */
export interface TransformProps {
  x?: PropertyValue; y?: PropertyValue; z?: PropertyValue;
  translateX?: PropertyValue; translateY?: PropertyValue; translateZ?: PropertyValue;
  rotate?: PropertyValue; rotateX?: PropertyValue; rotateY?: PropertyValue; rotateZ?: PropertyValue;
  scale?: PropertyValue; scaleX?: PropertyValue; scaleY?: PropertyValue; scaleZ?: PropertyValue;
  skew?: PropertyValue; skewX?: PropertyValue; skewY?: PropertyValue;
  perspective?: PropertyValue;
}

/** Paramètres d'`animate()` : réglages + propriétés à animer (CSS, variables, attributs, propriétés d'objets). */
export type AnimationParams = AnimationOptions & TransformProps & { [property: string]: PropertyValue | any };

export interface TimelineParams extends PlaybackParams<Timeline> {
  /** Paramètres hérités par chaque animation ajoutée. */
  defaults?: AnimationOptions;
}

/* —————————————————————————————— Lecture —————————————————————————————— */

/** Contrôles et état partagés par les animations et les timelines. */
export interface Playable extends PromiseLike<void> {
  readonly id: string;
  /** Durée totale (délai et boucles compris), `Infinity` en boucle infinie. */
  readonly duration: number;
  /** Durée d'une itération. */
  readonly iterationDuration: number;
  currentTime: number;
  /** Progression entre 0 et 1. */
  progress: number;
  speed: number;
  readonly paused: boolean;
  readonly began: boolean;
  readonly completed: boolean;
  readonly reversed: boolean;
  readonly iteration: number;
  play(): this;
  resume(): this;
  pause(): this;
  restart(): this;
  reverse(): this;
  /** Temps en ms (ou nom de libellé pour une timeline). */
  seek(time: number | string): this;
  complete(): this;
  cancel(): this;
  /** Arrête et restaure les valeurs d'origine. */
  revert(): this;
  then<R1 = void, R2 = never>(onFulfilled?: ((value: void) => R1 | PromiseLike<R1>) | null, onRejected?: ((reason: any) => R2 | PromiseLike<R2>) | null): Promise<R1 | R2>;
}

export declare class Animation implements Playable {
  constructor(targets: Targets, params?: AnimationParams);
  readonly targets: any[];
  readonly id: string;
  readonly duration: number;
  readonly iterationDuration: number;
  currentTime: number;
  progress: number;
  speed: number;
  readonly paused: boolean;
  readonly began: boolean;
  readonly completed: boolean;
  readonly reversed: boolean;
  readonly iteration: number;
  play(): this;
  resume(): this;
  pause(): this;
  restart(): this;
  reverse(): this;
  seek(time: number | string): this;
  complete(): this;
  cancel(): this;
  revert(): this;
  then<R1 = void, R2 = never>(onFulfilled?: ((value: void) => R1 | PromiseLike<R1>) | null, onRejected?: ((reason: any) => R2 | PromiseLike<R2>) | null): Promise<R1 | R2>;
}

/** Position dans une timeline : ms, '<', '<<', '+=200', '-=100', 'libellé', 'libellé+=50', '<<+=100', ou fonction. */
export type Position = number | string | ((timeline: Timeline) => number | string);

export interface TimelineChild {
  animation: Animation | Timeline;
  start: number;
  end: number;
}

export declare class Timeline implements Playable {
  constructor(params?: TimelineParams);
  /** Libellés : { nom: temps en ms }. */
  readonly labels: Record<string, number>;
  /** Enfants dans l'ordre chronologique. */
  readonly children: TimelineChild[];
  add(targets: Targets, params: AnimationParams, position?: Position): this;
  add(playable: Animation | Timeline, position?: Position): this;
  add(callback: (timeline: Timeline) => void, position?: Position): this;
  set(targets: Targets, values: Record<string, PropertyValue>, position?: Position): this;
  call(callback: (timeline: Timeline) => void, position?: Position): this;
  label(name: string, position?: Position): this;
  readonly id: string;
  readonly duration: number;
  readonly iterationDuration: number;
  currentTime: number;
  progress: number;
  speed: number;
  readonly paused: boolean;
  readonly began: boolean;
  readonly completed: boolean;
  readonly reversed: boolean;
  readonly iteration: number;
  play(): this;
  resume(): this;
  pause(): this;
  restart(): this;
  reverse(): this;
  seek(time: number | string): this;
  complete(): this;
  cancel(): this;
  revert(): this;
  then<R1 = void, R2 = never>(onFulfilled?: ((value: void) => R1 | PromiseLike<R1>) | null, onRejected?: ((reason: any) => R2 | PromiseLike<R2>) | null): Promise<R1 | R2>;
}

/** Anime des cibles. */
export declare function animate(targets: Targets, params: AnimationParams): Animation;
/** Applique des valeurs immédiatement. */
export declare function set(targets: Targets, values: Record<string, PropertyValue>): Animation;
/** Crée une timeline. */
export declare function timeline(params?: TimelineParams): Timeline;

/* —————————————————————————————— stagger —————————————————————————————— */

export interface StaggerOptions {
  from?: 'first' | 'last' | 'center' | 'random' | number;
  grid?: [columns: number, rows: number];
  axis?: 'x' | 'y';
  ease?: Ease;
  start?: number | string;
  reversed?: boolean;
  /** Graine de l'ordre aléatoire (`from: 'random'`). */
  seed?: number;
}

export interface StaggerFunction<T = number | string> {
  (target: any, index: number, total?: number): T;
  readonly isStagger: true;
}

/** Valeurs numériques : renvoie des nombres (utilisables pour `delay` et `duration`). */
export declare function stagger(value: number | [number, number], options?: StaggerOptions & { start?: number }): StaggerFunction<number>;
/** Valeurs avec unité ('12px', ['0deg', '90deg']) : renvoie des chaînes. */
export declare function stagger(value: number | string | [number | string, number | string], options?: StaggerOptions): StaggerFunction<number | string>;

/* —————————————————————————————— Easings —————————————————————————————— */

export interface SpringParams {
  mass?: number;
  stiffness?: number;
  damping?: number;
  velocity?: number;
}

export declare const eases: Record<EasingName, NamedEasing> & Record<string, NamedEasing>;
export declare const easeNames: string[];
export declare const linear: EasingFunction;
export declare function cubicBezier(x1?: number, y1?: number, x2?: number, y2?: number): EasingFunction;
export declare function steps(count?: number, jump?: 'start' | 'end'): EasingFunction;
export declare function spring(params?: SpringParams): SpringEasing;
export declare function parseEase(ease: Ease): EasingFunction | null;

/* —————————————————————————————— Texte —————————————————————————————— */

export interface SplitTextOptions {
  /** Lettres (une chaîne sert de nom de classe). */
  chars?: boolean | string;
  /** Mots. */
  words?: boolean | string;
  /** Lignes (selon la mise en page). */
  lines?: boolean | string;
  /** Masque `overflow: clip` autour de chaque morceau. */
  mask?: boolean | 'lines' | 'words' | 'chars';
  maskClass?: string;
}

export interface SplitTextResult {
  el: HTMLElement | undefined;
  chars: HTMLElement[];
  words: HTMLElement[];
  lines: HTMLElement[];
  masks: HTMLElement[];
  /** Rétablit le HTML d'origine. */
  revert(): SplitTextResult;
  /** Redécoupe (après un redimensionnement, pour les lignes). */
  refresh(): SplitTextResult;
}

export declare function splitText(target: Targets, options?: SplitTextOptions): SplitTextResult;

export interface ScrambleOptions extends Omit<PlaybackParams<Animation>, 'alternate' | 'reversed' | 'speed'> {
  text?: string;
  chars?: string;
  duration?: number;
  ease?: Ease;
  reveal?: 'start' | 'random';
  fps?: number;
  seed?: number;
}
export declare function scramble(target: Targets, options?: ScrambleOptions): Animation;

export interface TypewriterOptions {
  text?: string | string[];
  /** Caractères par seconde. */
  speed?: number;
  hold?: number;
  gap?: number;
  cursor?: boolean;
  cursorChar?: string;
  delay?: number;
  loop?: number | boolean;
  autoplay?: boolean;
  reducedMotion?: boolean;
  onComplete?: Callback<Timeline>;
}
export interface TypewriterTimeline extends Timeline {
  readonly caret: HTMLElement | null;
  readonly blink: Animation | null;
}
export declare function typewriter(target: Targets, options?: TypewriterOptions): TypewriterTimeline;

export interface OdometerOptions {
  value?: number | string;
  from?: number | string;
  duration?: number;
  ease?: Ease;
  stagger?: number;
  turns?: number;
  autoplay?: boolean;
  reducedMotion?: boolean;
}
export interface Odometer {
  readonly value: string;
  animation: Timeline | null;
  set(value: number | string, options?: Pick<OdometerOptions, 'duration' | 'ease' | 'stagger' | 'autoplay' | 'reducedMotion'>): Timeline | null;
  revert(): void;
}
export declare function odometer(target: Targets, options?: OdometerOptions): Odometer;

/* —————————————————————————————— Défilement —————————————————————————————— */

export type ScrollAction = 'play' | 'pause' | 'resume' | 'reverse' | 'restart' | 'reset' | 'complete' | 'none';

export interface ScrollOptions {
  target?: Targets;
  container?: Targets;
  axis?: 'x' | 'y';
  /** « bord de la cible, bord du conteneur » : 'top bottom', 'center 80%', 'top+=100 bottom'… */
  enter?: string;
  leave?: string;
  /** `true` : la progression suit le défilement ; nombre : lissage en secondes. */
  scrub?: boolean | number;
  /** Actions sur entrée, sortie, retour, sortie par le haut : 'play none none reverse'. */
  sync?: string;
  onEnter?: Callback<ScrollObserver>;
  onLeave?: Callback<ScrollObserver>;
  onEnterBack?: Callback<ScrollObserver>;
  onLeaveBack?: Callback<ScrollObserver>;
  onUpdate?: Callback<ScrollObserver>;
}

export declare class ScrollObserver {
  constructor(options?: ScrollOptions);
  readonly id: string;
  readonly target: Element | undefined;
  /** Progression lissée (0 → 1). */
  readonly progress: number;
  readonly rawProgress: number;
  /** Vitesse de défilement lissée, en px/s. */
  readonly velocity: number;
  readonly direction: 1 | -1;
  readonly isActive: boolean;
  link(playable: Animation | Timeline): this;
  refresh(): this;
  revert(): this;
}

export declare function onScroll(options?: ScrollOptions): ScrollObserver;

/* —————————————————————————————— SVG —————————————————————————————— */

export interface Drawable {
  readonly el: SVGGeometryElement;
  /** Fin de la portion tracée (0 → 1), ou « début fin » en chaîne. */
  draw: number | string;
  /** Début de la portion tracée (0 → 1). */
  drawStart: number;
  revert(): void;
}
export declare function drawable(targets: Targets): Drawable[];

export interface MotionPathOptions {
  rotate?: boolean;
  rotateOffset?: number;
  start?: number;
  end?: number;
}
export declare function motionPath(path: Targets, options?: MotionPathOptions): { x: CustomValue; y: CustomValue; rotate?: CustomValue };

/* —————————————————————————————— Moteur —————————————————————————————— */

export interface Engine {
  timeScale: number;
  manual: boolean;
  pauseOnHidden: boolean;
  lagSmoothing: { threshold: number; adjusted: number } | null;
  reducedMotion: 'auto' | boolean;
  readonly prefersReducedMotion: boolean;
  defaults: AnimationOptions;
  readonly time: number;
  readonly activeCount: number;
  tick(ms?: number): void;
  /** Rappel à chaque image ; renvoie la fonction d'arrêt. */
  onFrame(callback: (deltaMs: number, timeMs: number) => void): () => void;
  pause(): void;
  resume(): void;
}
export declare const engine: Engine;

/* —————————————————————————————— Utilitaires —————————————————————————————— */

export interface RandomGenerator {
  (): number;
  (max: number): number;
  (min: number, max: number, decimals?: number): number;
  int(min: number, max: number): number;
  pick<T>(list: ArrayLike<T>): T;
  shuffle<T>(list: Iterable<T>): T[];
}

export declare function clamp(value: number, min?: number, max?: number): number;
export declare function lerp(a: number, b: number, t: number): number;
export declare function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number;
export declare function round(value: number, decimals?: number): number;
export declare function snap(value: number, increment: number | number[]): number;
export declare function wrap(value: number, min: number, max: number): number;
export declare function random(): number;
export declare function random(max: number): number;
export declare function random(min: number, max: number, decimals?: number): number;
export declare function createRandom(seed?: number): RandomGenerator;
export declare function shuffle<T>(list: Iterable<T>, rng?: RandomGenerator | number): T[];
export declare function get(target: Targets, property: string, unit?: string): string | number | undefined;
export declare function remove(targets: Targets, properties?: string | string[]): any[];

export interface Utils {
  clamp: typeof clamp;
  lerp: typeof lerp;
  mapRange: typeof mapRange;
  round: typeof round;
  snap: typeof snap;
  wrap: typeof wrap;
  random: typeof random;
  seed(n: number): RandomGenerator;
  createRandom: typeof createRandom;
  shuffle: typeof shuffle;
  get: typeof get;
  set: typeof set;
  remove: typeof remove;
  $(targets: Targets): any[];
}
export declare const utils: Utils;

export declare const version: string;
