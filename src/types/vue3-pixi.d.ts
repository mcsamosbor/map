// src/vue3-pixi.d.ts
import type { Viewport, IViewportOptions } from "pixi-viewport";
import type {
  Application,
  Container,
  ContainerEvents,
  ViewContainerOptions,
  Texture,
} from "pixi.js";
import "vue3-pixi";
import type { ContainerProps, GraphicsProps, TextProps } from "vue3-pixi";

export interface ViewportProps extends IViewportOptions {
  application: Application;
}
type Point<Key extends string> = {
  [K in Key]?: Partial<PointData> | number | [number, number];
} & {
  [K in `${Key}X`]?: number;
} & {
  [K in `${Key}Y`]?: number;
};
type ExtractProps<T, U = {}> = Overwrite<
  Partial<Omit<OmitBy<Omit<T, `on${string}`>, AnyFn>, `_${string}`>>,
  U
>;
type AllowedPointsAttributes = Point<"position"> &
  Point<"anchor"> &
  Point<"scale"> &
  Point<"skew"> &
  Point<"pivot">;
type ExtractContainerProps<T, U = {}> = ExtractProps<Overwrite<T, AllowedPointsAttributes>, U>;
type OmitContainerOptions<T> = Omit<T, keyof ViewContainerOptions>;
type NormalizeTexture = Texture | string;
interface OptionsOverrides {
  texture: NormalizeTexture;
  textures: any;
}
type ExtractContainerOptions<T> = OmitContainerOptions<{
  [K in keyof T]: K extends keyof OptionsOverrides ? OptionsOverrides[K] : T[K];
}>;
type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U;
type ContainerChild = Container;
interface AllowedContainerEvents<
  C extends ContainerChild = ContainerChild,
> extends ContainerEvents<C> {}
type ExtractContainerEvents<T, U = {}> = Overwrite<
  AllowedContainerEvents,
  {
    effect: [T];
    render: [T, Renderer];
  } & U
>;
type VNodePixiMountHook = (vnode: VNode<any>) => void;
type VNodePixiUpdateHook = (vnode: VNode<any>, oldVNode: VNode<any>) => void;

type VnodePixiProps = Overwrite<
  VNodeProps,
  {
    onVnodeBeforeMount?: VNodePixiMountHook | VNodePixiMountHook[];
    onVnodeMounted?: VNodePixiMountHook | VNodePixiMountHook[];
    onVnodeBeforeUpdate?: VNodePixiUpdateHook | VNodePixiUpdateHook[];
    onVnodeUpdated?: VNodePixiUpdateHook | VNodePixiUpdateHook[];
    onVnodeBeforeUnmount?: VNodePixiMountHook | VNodePixiMountHook[];
    onVnodeUnmounted?: VNodePixiMountHook | VNodePixiMountHook[];
  }
>;
type DefineElement<
  InstanceProps = {},
  Events extends {
    [key: string]: any;
  } = {},
> = DefineComponent<
  InstanceProps,
  {},
  unknown,
  {},
  {},
  ComponentOptionsMixin,
  ComponentOptionsMixin,
  Extract<keyof Events, string>[],
  Extract<keyof Events, string>,
  VnodePixiProps & InstanceProps,
  Readonly<InstanceProps> & {
    [key in Extract<keyof Events, string> as `on${Capitalize<key>}`]?:
      | ((...args: Events[key]) => any)
      | undefined;
  },
  {}
>;
type DefineContainerElement<T, O = {}> = DefineElement<
  ExtractContainerProps<T, ExtractContainerOptions<O>>,
  ExtractContainerEvents<T>
>;

type ViewportElement = DefineContainerElement<Viewport, IViewportOptions>;

declare module "@vue/runtime-core" {
  export interface GlobalComponents {
    Viewport: (props: IViewportOptions) => any;
  }
}
