import{A as e,C as t,D as n,E as r,F as i,H as a,L as o,M as s,O as c,P as l,Q as u,T as d,_ as f,b as p,bt as m,c as h,ct as g,d as ee,dt as _,et as v,f as y,ft as b,g as x,gt as S,h as C,ht as te,i as ne,it as w,j as T,k as E,l as D,m as re,n as ie,nt as ae,p as oe,r as se,rt as ce,s as le,t as O,tt as ue,u as de,v as k,vt as fe,w as pe,xt as A}from"./colorToUniform-fMqz7e77.js";import{c as j,d as M,f as me,i as N,l as he,n as ge,o as _e,r as ve,s as ye,t as P,u as be}from"./CanvasTextGenerator-BVJC-Ycv.js";import{t as F}from"./CanvasPool-CWHSHJ18.js";var I=class{static init(e){Object.defineProperty(this,"resizeTo",{configurable:!0,set(e){globalThis.removeEventListener(`resize`,this.queueResize),this._resizeTo=e,e&&(globalThis.addEventListener(`resize`,this.queueResize),this.resize())},get(){return this._resizeTo}}),this.queueResize=()=>{this._resizeTo&&(this._cancelResize(),this._resizeId=requestAnimationFrame(()=>this.resize()))},this._cancelResize=()=>{this._resizeId&&=(cancelAnimationFrame(this._resizeId),null)},this.resize=()=>{if(!this._resizeTo)return;this._cancelResize();let e,t;if(this._resizeTo===globalThis.window)e=globalThis.innerWidth,t=globalThis.innerHeight;else{let{clientWidth:n,clientHeight:r}=this._resizeTo;e=n,t=r}this.renderer.resize(e,t),this.render()},this._resizeId=null,this._resizeTo=null,this.resizeTo=e.resizeTo||null}static destroy(){globalThis.removeEventListener(`resize`,this.queueResize),this._cancelResize(),this._cancelResize=null,this.queueResize=null,this.resizeTo=null,this.resize=null}};I.extension=m.Application;var L=class{static init(e){e=Object.assign({autoStart:!0,sharedTicker:!1},e),Object.defineProperty(this,"ticker",{configurable:!0,set(e){this._ticker&&this._ticker.remove(this.render,this),this._ticker=e,e&&e.add(this.render,this,i.LOW)},get(){return this._ticker}}),this.stop=()=>{this._ticker.stop()},this.start=()=>{this._ticker.start()},this._ticker=null,this.ticker=e.sharedTicker?l.shared:new l,e.autoStart&&this.start()}static destroy(){if(this._ticker){let e=this._ticker;this.ticker=null,e.destroy()}}};L.extension=m.Application;var xe=class extends fe{constructor(){super(...arguments),this.chars=Object.create(null),this.lineHeight=0,this.fontFamily=``,this.fontMetrics={fontSize:0,ascent:0,descent:0},this.baseLineOffset=0,this.distanceField={type:`none`,range:0},this.pages=[],this.applyFillAsTint=!0,this.baseMeasurementFontSize=100,this.baseRenderedFontSize=100}get font(){return _(b,`BitmapFont.font is deprecated, please use BitmapFont.fontFamily instead.`),this.fontFamily}get pageTextures(){return _(b,`BitmapFont.pageTextures is deprecated, please use BitmapFont.pages instead.`),this.pages}get size(){return _(b,`BitmapFont.size is deprecated, please use BitmapFont.fontMetrics.fontSize instead.`),this.fontMetrics.fontSize}get distanceFieldRange(){return _(b,`BitmapFont.distanceFieldRange is deprecated, please use BitmapFont.distanceField.range instead.`),this.distanceField.range}get distanceFieldType(){return _(b,`BitmapFont.distanceFieldType is deprecated, please use BitmapFont.distanceField.type instead.`),this.distanceField.type}destroy(e=!1){this.emit(`destroy`,this),this.removeAllListeners();for(let e in this.chars)this.chars[e].texture?.destroy();this.chars=null,e&&(this.pages.forEach(e=>e.texture.destroy(!0)),this.pages=null)}},R=class e extends xe{constructor(t){super(),this.resolution=1,this.pages=[],this._padding=0,this._measureCache=Object.create(null),this._currentChars=[],this._currentX=0,this._currentY=0,this._currentMaxCharHeight=0,this._currentPageIndex=-1,this._skipKerning=!1;let n={...e.defaultOptions,...t};this._textureSize=n.textureSize,this._mipmap=n.mipmap;let r=n.style.clone();n.overrideFill&&(r._fill.color=16777215,r._fill.alpha=1,r._fill.texture=w.WHITE,r._fill.fill=null),this.applyFillAsTint=n.overrideFill;let i=r.fontSize;r.fontSize=this.baseMeasurementFontSize;let a=he(r);n.overrideSize?r._stroke&&(r._stroke.width*=this.baseRenderedFontSize/i):r.fontSize=this.baseRenderedFontSize=i,this._style=r,this._skipKerning=n.skipKerning??!1,this.resolution=n.resolution??1,this._padding=n.padding??4,n.textureStyle&&(this._textureStyle=n.textureStyle instanceof g?n.textureStyle:new g(n.textureStyle)),this.fontMetrics=j.measureFont(a),this.lineHeight=r.lineHeight||this.fontMetrics.fontSize||r.fontSize}ensureCharacters(e){let t=j.graphemeSegmenter(e).filter(e=>!this._currentChars.includes(e)).filter((e,t,n)=>n.indexOf(e)===t);if(!t.length)return;this._currentChars=[...this._currentChars,...t];let n;n=this._currentPageIndex===-1?this._nextPage():this.pages[this._currentPageIndex];let{canvas:r,context:i}=n.canvasAndContext,a=n.texture.source,o=this._style,s=this._currentX,c=this._currentY,l=this._currentMaxCharHeight,u=this.baseRenderedFontSize/this.baseMeasurementFontSize,d=this._padding*u,f=!1,p=r.width/this.resolution,m=r.height/this.resolution;for(let e=0;e<t.length;e++){let n=t[e],h=j.measureText(n,o,r,!1);h.lineHeight=h.height;let g=h.width*u,ee=Math.ceil((o.fontStyle===`italic`?2:1)*g),_=h.height*u,v=ee+d*2,y=_+d*2;if(f=!1,n!==`
`&&n!==`\r`&&n!==`	`&&n!==` `&&(f=!0,l=Math.ceil(Math.max(y,l))),s+v>p&&(c+=l,l=y,s=0,c+l>m)){a.update();let e=this._nextPage();r=e.canvasAndContext.canvas,i=e.canvasAndContext.context,a=e.texture.source,s=0,c=0,l=0}let b=g/u-(o.dropShadow?.distance??0)-(o._stroke?.width??0);if(this.chars[n]={id:n.codePointAt(0),xOffset:-this._padding,yOffset:-this._padding,xAdvance:b,kerning:{}},f){this._drawGlyph(i,h,s+d,c+d,u,o);let e=a.width*u,t=a.height*u,r=new te(s/e*a.width,c/t*a.height,v/e*a.width,y/t*a.height);this.chars[n].texture=new w({source:a,frame:r}),s+=Math.ceil(v)}}a.update(),this._currentX=s,this._currentY=c,this._currentMaxCharHeight=l,this._skipKerning&&this._applyKerning(t,i)}get pageTextures(){return _(b,`BitmapFont.pageTextures is deprecated, please use BitmapFont.pages instead.`),this.pages}_applyKerning(e,t){let n=this._measureCache;for(let r=0;r<e.length;r++){let i=e[r];for(let e=0;e<this._currentChars.length;e++){let r=this._currentChars[e],a=n[i];a||=n[i]=t.measureText(i).width;let o=n[r];o||=n[r]=t.measureText(r).width;let s=t.measureText(i+r).width,c=s-(a+o);c&&(this.chars[i].kerning[r]=c),s=t.measureText(i+r).width,c=s-(a+o),c&&(this.chars[r].kerning[i]=c)}}}_nextPage(){this._currentPageIndex++;let e=this.resolution,t=F.getOptimalCanvasAndContext(this._textureSize,this._textureSize,e);this._setupContext(t.context,this._style,e);let n=e*(this.baseRenderedFontSize/this.baseMeasurementFontSize),r=new w({source:new me({resource:t.canvas,resolution:n,alphaMode:`premultiply-alpha-on-upload`,autoGenerateMipmaps:this._mipmap})});this._textureStyle&&(r.source.style=this._textureStyle);let i={canvasAndContext:t,texture:r};return this.pages[this._currentPageIndex]=i,i}_setupContext(e,t,n){t.fontSize=this.baseRenderedFontSize,e.scale(n,n),e.font=he(t),t.fontSize=this.baseMeasurementFontSize,e.textBaseline=t.textBaseline;let r=t._stroke,i=r?.width??0;if(r&&(e.lineWidth=i,e.lineJoin=r.join,e.miterLimit=r.miterLimit,e.strokeStyle=ve(r,e)),t._fill&&(e.fillStyle=ve(t._fill,e)),t.dropShadow){let r=t.dropShadow,i=ue.shared.setValue(r.color).toArray(),a=r.blur*n,o=r.distance*n;e.shadowColor=`rgba(${i[0]*255},${i[1]*255},${i[2]*255},${r.alpha})`,e.shadowBlur=a,e.shadowOffsetX=Math.cos(r.angle)*o,e.shadowOffsetY=Math.sin(r.angle)*o}else e.shadowColor=`black`,e.shadowBlur=0,e.shadowOffsetX=0,e.shadowOffsetY=0}_drawGlyph(e,t,n,r,i,a){let o=t.text,s=t.fontProperties,c=(a._stroke?.width??0)*i,l=n+c/2,u=r-c/2,d=s.descent*i,f=t.lineHeight*i,p=!1;a.stroke&&c&&(p=!0,e.strokeText(o,l,u+f-d));let{shadowBlur:m,shadowOffsetX:h,shadowOffsetY:g}=e;a._fill&&(p&&(e.shadowBlur=0,e.shadowOffsetX=0,e.shadowOffsetY=0),e.fillText(o,l,u+f-d)),p&&(e.shadowBlur=m,e.shadowOffsetX=h,e.shadowOffsetY=g)}destroy(){super.destroy();for(let e=0;e<this.pages.length;e++){let{canvasAndContext:t,texture:n}=this.pages[e];F.returnCanvasAndContext(t),n.destroy(!0)}this.pages=null}};R.defaultOptions={textureSize:512,style:new N,mipmap:!0};var z=R;function B(e,t,n,r){let i={width:0,height:0,offsetY:0,scale:t.fontSize/n.baseMeasurementFontSize,lines:[{width:0,charPositions:[],spaceWidth:0,spacesIndex:[],chars:[]}]};i.offsetY=n.baseLineOffset;let a=i.lines[0],o=null,s=!0,c={spaceWord:!1,width:0,start:0,index:0,positions:[],chars:[]},l=n.baseMeasurementFontSize/t.fontSize,u=t.letterSpacing*l,d=t.wordWrapWidth*l,f=t.lineHeight?t.lineHeight*l:n.lineHeight,p=t.wordWrap&&t.breakWords,m=e=>{let t=a.width;for(let n=0;n<c.index;n++){let r=e.positions[n];a.chars.push(e.chars[n]),a.charPositions.push(r+t)}a.width+=e.width,s=!1,c.width=0,c.index=0,c.chars.length=0},h=()=>{let e=a.chars.length-1;if(r){let t=a.chars[e];for(;t===` `;)a.width-=n.chars[t].xAdvance,t=a.chars[--e]}i.width=Math.max(i.width,a.width),a={width:0,charPositions:[],chars:[],spaceWidth:0,spacesIndex:[]},s=!0,i.lines.push(a),i.height+=f},g=e=>e-u>d;for(let r=0;r<e.length+1;r++){let i,l=r===e.length;l||(i=e[r]);let d=n.chars[i]||n.chars[` `];if(/(?:\s)/.test(i)||i===`\r`||i===`
`||l){if(!s&&t.wordWrap&&g(a.width+c.width)?(h(),m(c),l||a.charPositions.push(0)):(c.start=a.width,m(c),l||a.charPositions.push(0)),i===`\r`||i===`
`)h();else if(!l){let e=d.xAdvance+(d.kerning[o]||0)+u;a.width+=e,a.spaceWidth=e,a.spacesIndex.push(a.charPositions.length),a.chars.push(i)}}else{let e=d.kerning[o]||0,t=d.xAdvance+e+u;p&&g(a.width+c.width+t)&&(m(c),h()),c.positions[c.index++]=c.width+e,c.chars.push(i),c.width+=t}o=i}return h(),t.align===`center`?Se(i):t.align===`right`?Ce(i):t.align===`justify`&&we(i),i}function Se(e){for(let t=0;t<e.lines.length;t++){let n=e.lines[t],r=e.width/2-n.width/2;for(let e=0;e<n.charPositions.length;e++)n.charPositions[e]+=r}}function Ce(e){for(let t=0;t<e.lines.length;t++){let n=e.lines[t],r=e.width-n.width;for(let e=0;e<n.charPositions.length;e++)n.charPositions[e]+=r}}function we(e){let t=e.width;for(let n=0;n<e.lines.length;n++){let r=e.lines[n],i=0,a=r.spacesIndex[i++],o=0,s=r.spacesIndex.length,c=(t-r.width)/s;for(let e=0;e<r.charPositions.length;e++)e===a&&(a=r.spacesIndex[i++],o+=c),r.charPositions[e]+=o}}function Te(e){if(e===``)return[];typeof e==`string`&&(e=[e]);let t=[];for(let n=0,r=e.length;n<r;n++){let r=e[n];if(Array.isArray(r)){if(r.length!==2)throw Error(`[BitmapFont]: Invalid character range length, expecting 2 got ${r.length}.`);if(r[0].length===0||r[1].length===0)throw Error(`[BitmapFont]: Invalid character delimiter.`);let e=r[0].charCodeAt(0),n=r[1].charCodeAt(0);if(n<e)throw Error(`[BitmapFont]: Invalid character range.`);for(let r=e,i=n;r<=i;r++)t.push(String.fromCharCode(r))}else t.push(...Array.from(r))}if(t.length===0)throw Error(`[BitmapFont]: Empty set when resolving characters.`);return t}var V=0,Ee=new class{constructor(){this.ALPHA=[[`a`,`z`],[`A`,`Z`],` `],this.NUMERIC=[[`0`,`9`]],this.ALPHANUMERIC=[[`a`,`z`],[`A`,`Z`],[`0`,`9`],` `],this.ASCII=[[` `,`~`]],this.defaultOptions={chars:this.ALPHANUMERIC,resolution:1,padding:4,skipKerning:!1,textureStyle:null},this.measureCache=be(1e3)}getFont(e,t){let n=`${t.fontFamily}-bitmap`,r=!0;if(t._fill.fill&&!t._stroke?(n+=t._fill.fill.styleKey,r=!1):(t._stroke||t.dropShadow)&&(n=`${t.styleKey}-bitmap`,r=!1),!M.has(n)){let e=Object.create(t);e.lineHeight=0;let i=new z({style:e,overrideFill:r,overrideSize:!0,...this.defaultOptions});V++,V>50&&v(`BitmapText`,`You have dynamically created ${V} bitmap fonts, this can be inefficient. Try pre installing your font styles using \`BitmapFont.install({name:"style1", style})\``),i.once(`destroy`,()=>{V--,M.remove(n)}),M.set(n,i)}let i=M.get(n);return i.ensureCharacters?.(e),i}getLayout(e,t,n=!0){let r=this.getFont(e,t),i=`${e}-${t.styleKey}-${n}`;if(this.measureCache.has(i))return this.measureCache.get(i);let a=B(j.graphemeSegmenter(e),t,r,n);return this.measureCache.set(i,a),a}measureText(e,t,n=!0){return this.getLayout(e,t,n)}install(...e){let t=e[0];typeof t==`string`&&(t={name:t,style:e[1],chars:e[2]?.chars,resolution:e[2]?.resolution,padding:e[2]?.padding,skipKerning:e[2]?.skipKerning},_(b,`BitmapFontManager.install(name, style, options) is deprecated, use BitmapFontManager.install({name, style, ...options})`));let n=t?.name;if(!n)throw Error("[BitmapFontManager] Property `name` is required.");t={...this.defaultOptions,...t};let r=t.style,i=r instanceof N?r:new N(r),a=new z({style:i,overrideFill:t.dynamicFill??this._canUseTintForStyle(i),skipKerning:t.skipKerning,padding:t.padding,resolution:t.resolution,overrideSize:!1,textureStyle:t.textureStyle}),o=Te(t.chars);return a.ensureCharacters(o.join(``)),M.set(`${n}-bitmap`,a),a.once(`destroy`,()=>M.remove(`${n}-bitmap`)),a}uninstall(e){let t=`${e}-bitmap`,n=M.get(t);n&&n.destroy()}_canUseTintForStyle(e){return!e._stroke&&(!e.dropShadow||e.dropShadow.color===0)&&!e._fill.fill&&e._fill.color===16777215}},De=`in vec2 aPosition;
out vec2 vTextureCoord;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

vec4 filterVertexPosition( void )
{
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
    
    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;

    return vec4(position, 0.0, 1.0);
}

vec2 filterTextureCoord( void )
{
    return aPosition * (uOutputFrame.zw * uInputSize.zw);
}

void main(void)
{
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
}
`,Oe=`in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
void main() {
    finalColor = texture(uTexture, vTextureCoord);
}
`,H=`struct GlobalFilterUniforms {
  uInputSize: vec4<f32>,
  uInputPixel: vec4<f32>,
  uInputClamp: vec4<f32>,
  uOutputFrame: vec4<f32>,
  uGlobalFrame: vec4<f32>,
  uOutputTexture: vec4<f32>,
};

@group(0) @binding(0) var <uniform> gfu: GlobalFilterUniforms;
@group(0) @binding(1) var uTexture: texture_2d<f32>;
@group(0) @binding(2) var uSampler: sampler;

struct VSOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>
};

fn filterVertexPosition(aPosition: vec2<f32>) -> vec4<f32>
{
    var position = aPosition * gfu.uOutputFrame.zw + gfu.uOutputFrame.xy;

    position.x = position.x * (2.0 / gfu.uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0 * gfu.uOutputTexture.z / gfu.uOutputTexture.y) - gfu.uOutputTexture.z;

    return vec4(position, 0.0, 1.0);
}

fn filterTextureCoord(aPosition: vec2<f32>) -> vec2<f32>
{
    return aPosition * (gfu.uOutputFrame.zw * gfu.uInputSize.zw);
}

@vertex
fn mainVertex(
  @location(0) aPosition: vec2<f32>,
) -> VSOutput {
  return VSOutput(
   filterVertexPosition(aPosition),
   filterTextureCoord(aPosition)
  );
}

@fragment
fn mainFragment(
  @location(0) uv: vec2<f32>,
) -> @location(0) vec4<f32> {
    return textureSample(uTexture, uSampler, uv);
}
`,ke=class extends pe{constructor(){let t=e.from({vertex:{source:H,entryPoint:`mainVertex`},fragment:{source:H,entryPoint:`mainFragment`},name:`passthrough-filter`}),n=s.from({vertex:De,fragment:Oe,name:`passthrough-filter`});super({gpuProgram:t,glProgram:n})}},U=class{constructor(e){this._renderer=e}push(e,t,n){this._renderer.renderPipes.batch.break(n),n.add({renderPipeId:`filter`,canBundle:!1,action:`pushFilter`,container:t,filterEffect:e})}pop(e,t,n){this._renderer.renderPipes.batch.break(n),n.add({renderPipeId:`filter`,action:`popFilter`,canBundle:!1})}execute(e){e.action===`pushFilter`?this._renderer.filter.push(e):e.action===`popFilter`&&this._renderer.filter.pop()}destroy(){this._renderer=null}};U.extension={type:[m.WebGLPipes,m.WebGPUPipes,m.CanvasPipes],name:`filter`};var W=new S;function Ae(e,t){t.clear();let n=t.matrix;for(let n=0;n<e.length;n++){let r=e[n];if(r.globalDisplayStatus<7)continue;let i=r.renderGroup??r.parentRenderGroup;t.matrix=i?.isCachedAsTexture?W.copyFrom(i.textureOffsetInverseTransform).append(r.worldTransform):i?._parentCacheAsTextureRenderGroup?W.copyFrom(i._parentCacheAsTextureRenderGroup.inverseWorldTransform).append(r.groupTransform):r.worldTransform,t.addBounds(r.bounds)}return t.matrix=n,t}var je=new x({attributes:{aPosition:{buffer:new Float32Array([0,0,1,0,1,1,0,1]),format:`float32x2`,stride:8,offset:0}},indexBuffer:new Uint32Array([0,1,2,0,2,3])}),Me=class{constructor(){this.skip=!1,this.inputTexture=null,this.backTexture=null,this.filters=null,this.bounds=new ae,this.container=null,this.blendRequired=!1,this.outputRenderSurface=null,this.globalFrame={x:0,y:0,width:0,height:0},this.firstEnabledIndex=-1,this.lastEnabledIndex=-1}},G=class{constructor(e){this._filterStackIndex=0,this._filterStack=[],this._filterGlobalUniforms=new E({uInputSize:{value:new Float32Array(4),type:`vec4<f32>`},uInputPixel:{value:new Float32Array(4),type:`vec4<f32>`},uInputClamp:{value:new Float32Array(4),type:`vec4<f32>`},uOutputFrame:{value:new Float32Array(4),type:`vec4<f32>`},uGlobalFrame:{value:new Float32Array(4),type:`vec4<f32>`},uOutputTexture:{value:new Float32Array(4),type:`vec4<f32>`}}),this._globalFilterBindGroup=new c({}),this.renderer=e}get activeBackTexture(){return this._activeFilterData?.backTexture}push(e){let t=this.renderer,n=e.filterEffect.filters,r=this._pushFilterData();r.skip=!1,r.filters=n,r.container=e.container,r.outputRenderSurface=t.renderTarget.renderSurface;let i=t.renderTarget.renderTarget.colorTexture.source,a=i.resolution,o=i.antialias;if(n.every(e=>!e.enabled)){r.skip=!0;return}let s=r.bounds;if(this._calculateFilterArea(e,s),this._calculateFilterBounds(r,t.renderTarget.rootViewPort,o,a,1),r.skip)return;let c=this._getPreviousFilterData(),l=this._findFilterResolution(a),u=0,d=0;c&&(u=c.bounds.minX,d=c.bounds.minY),this._calculateGlobalFrame(r,u,d,l,i.width,i.height),this._setupFilterTextures(r,s,t,c)}generateFilteredTexture({texture:e,filters:t}){let n=this._pushFilterData();this._activeFilterData=n,n.skip=!1,n.filters=t;let r=e.source,i=r.resolution,o=r.antialias;if(t.every(e=>!e.enabled))return n.skip=!0,e;let s=n.bounds;if(s.addRect(e.frame),this._calculateFilterBounds(n,s.rectangle,o,i,0),n.skip)return e;let c=i;this._calculateGlobalFrame(n,0,0,c,r.width,r.height),n.outputRenderSurface=a.getOptimalTexture(s.width,s.height,n.resolution,n.antialias),n.backTexture=w.EMPTY,n.inputTexture=e,this.renderer.renderTarget.finishRenderPass(),this._applyFiltersToTexture(n,!0);let l=n.outputRenderSurface;return l.source.alphaMode=`premultiplied-alpha`,l}pop(){let e=this.renderer,t=this._popFilterData();t.skip||(e.globalUniforms.pop(),e.renderTarget.finishRenderPass(),this._activeFilterData=t,this._applyFiltersToTexture(t,!1),t.blendRequired&&a.returnTexture(t.backTexture),a.returnTexture(t.inputTexture))}getBackTexture(e,t,n){let r=e.colorTexture.source._resolution,i=a.getOptimalTexture(t.width,t.height,r,!1),o=t.minX,s=t.minY;n&&(o-=n.minX,s-=n.minY),o=Math.floor(o*r),s=Math.floor(s*r);let c=Math.ceil(t.width*r),l=Math.ceil(t.height*r);return this.renderer.renderTarget.copyToTexture(e,i,{x:o,y:s},{width:c,height:l},{x:0,y:0}),i}applyFilter(e,t,n,r){let i=this.renderer,a=this._activeFilterData,o=a.outputRenderSurface===n,s=i.renderTarget.rootRenderTarget.colorTexture.source._resolution,c=this._findFilterResolution(s),l=0,u=0;if(o){let e=this._findPreviousFilterOffset();l=e.x,u=e.y}this._updateFilterUniforms(t,n,a,l,u,c,o,r);let d=e.enabled?e:this._getPassthroughFilter();this._setupBindGroupsAndRender(d,t,i)}calculateSpriteMatrix(e,t){let n=this._activeFilterData,r=e.set(n.inputTexture._source.width,0,0,n.inputTexture._source.height,n.bounds.minX,n.bounds.minY),i=t.worldTransform.copyTo(S.shared),a=t.renderGroup||t.parentRenderGroup;return a&&a.cacheToLocalTransform&&i.prepend(a.cacheToLocalTransform),i.invert(),r.prepend(i),r.scale(1/t.texture.orig.width,1/t.texture.orig.height),r.translate(t.anchor.x,t.anchor.y),r}destroy(){this._passthroughFilter?.destroy(!0),this._passthroughFilter=null}_getPassthroughFilter(){return this._passthroughFilter??=new ke,this._passthroughFilter}_setupBindGroupsAndRender(e,t,r){if(r.renderPipes.uniformBatch){let e=r.renderPipes.uniformBatch.getUboResource(this._filterGlobalUniforms);this._globalFilterBindGroup.setResource(e,0)}else this._globalFilterBindGroup.setResource(this._filterGlobalUniforms,0);this._globalFilterBindGroup.setResource(t.source,1),this._globalFilterBindGroup.setResource(t.source.style,2),e.groups[0]=this._globalFilterBindGroup,r.encoder.draw({geometry:je,shader:e,state:e._state,topology:`triangle-list`}),r.type===n.WEBGL&&r.renderTarget.finishRenderPass()}_setupFilterTextures(e,t,n,r){if(e.backTexture=w.EMPTY,e.inputTexture=a.getOptimalTexture(t.width,t.height,e.resolution,e.antialias),e.blendRequired){n.renderTarget.finishRenderPass();let i=n.renderTarget.getRenderTarget(e.outputRenderSurface);e.backTexture=this.getBackTexture(i,t,r?.bounds)}n.renderTarget.bind(e.inputTexture,!0),n.globalUniforms.push({offset:t})}_calculateGlobalFrame(e,t,n,r,i,a){let o=e.globalFrame;o.x=t*r,o.y=n*r,o.width=i*r,o.height=a*r}_updateFilterUniforms(e,t,n,r,i,a,o,s){let c=this._filterGlobalUniforms.uniforms,l=c.uOutputFrame,u=c.uInputSize,d=c.uInputPixel,f=c.uInputClamp,p=c.uGlobalFrame,m=c.uOutputTexture;o?(l[0]=n.bounds.minX-r,l[1]=n.bounds.minY-i):(l[0]=0,l[1]=0),l[2]=e.frame.width,l[3]=e.frame.height,u[0]=e.source.width,u[1]=e.source.height,u[2]=1/u[0],u[3]=1/u[1],d[0]=e.source.pixelWidth,d[1]=e.source.pixelHeight,d[2]=1/d[0],d[3]=1/d[1],f[0]=.5*d[2],f[1]=.5*d[3],f[2]=e.frame.width*u[2]-.5*d[2],f[3]=e.frame.height*u[3]-.5*d[3];let h=this.renderer.renderTarget.rootRenderTarget.colorTexture;p[0]=r*a,p[1]=i*a,p[2]=h.source.width*a,p[3]=h.source.height*a,t instanceof w&&(t.source.resource=null);let g=this.renderer.renderTarget.getRenderTarget(t);this.renderer.renderTarget.bind(t,!!s),t instanceof w?(m[0]=t.frame.width,m[1]=t.frame.height):(m[0]=g.width,m[1]=g.height),m[2]=g.isRoot?-1:1,this._filterGlobalUniforms.update()}_findFilterResolution(e){let t=this._filterStackIndex-1;for(;t>0&&this._filterStack[t].skip;)--t;return t>0&&this._filterStack[t].inputTexture?this._filterStack[t].inputTexture.source._resolution:e}_findPreviousFilterOffset(){let e=0,t=0,n=this._filterStackIndex;for(;n>0;){n--;let r=this._filterStack[n];if(!r.skip){e=r.bounds.minX,t=r.bounds.minY;break}}return{x:e,y:t}}_calculateFilterArea(e,t){if(e.renderables?Ae(e.renderables,t):e.filterEffect.filterArea?(t.clear(),t.addRect(e.filterEffect.filterArea),t.applyMatrix(e.container.worldTransform)):e.container.getFastGlobalBounds(!0,t),e.container){let n=(e.container.renderGroup||e.container.parentRenderGroup).cacheToLocalTransform;n&&t.applyMatrix(n)}}_applyFiltersToTexture(e,t){let n=e.inputTexture,r=e.bounds,i=e.filters,o=e.firstEnabledIndex,s=e.lastEnabledIndex;if(this._globalFilterBindGroup.setResource(n.source.style,2),this._globalFilterBindGroup.setResource(e.backTexture.source,3),o===s)i[o].apply(this,n,e.outputRenderSurface,t);else{let n=e.inputTexture,c=a.getOptimalTexture(r.width,r.height,n.source._resolution,!1),l=c;for(let e=o;e<s;e++){let t=i[e];if(!t.enabled)continue;t.apply(this,n,l,!0);let r=n;n=l,l=r}i[s].apply(this,n,e.outputRenderSurface,t),a.returnTexture(c)}}_calculateFilterBounds(e,t,n,r,i){let a=this.renderer,o=e.bounds,s=e.filters,c=1/0,l=0,u=!0,d=!1,f=!1,p=!0,m=-1,h=-1;for(let e=0;e<s.length;e++){let t=s[e];if(t.enabled){if(m===-1&&(m=e),h=e,c=Math.min(c,t.resolution===`inherit`?r:t.resolution),l+=t.padding,t.antialias===`off`?u=!1:t.antialias===`inherit`&&(u&&=n),t.clipToViewport||(p=!1),!(t.compatibleRenderers&a.type)){f=!1;break}if(t.blendRequired&&!(a.backBuffer?.useBackBuffer??!0)){v("Blend filter requires backBuffer on WebGL renderer to be enabled. Set `useBackBuffer: true` in the renderer options."),f=!1;break}f=!0,d||=t.blendRequired}}if(!f){e.skip=!0;return}if(p&&o.fitBounds(0,t.width/r,0,t.height/r),o.scale(c).ceil().scale(1/c).pad((l|0)*i),!o.isPositive){e.skip=!0;return}e.antialias=u,e.resolution=c,e.blendRequired=d,e.firstEnabledIndex=m,e.lastEnabledIndex=h}_popFilterData(){return this._filterStackIndex--,this._filterStack[this._filterStackIndex]}_getPreviousFilterData(){let e,t=this._filterStackIndex-1;for(;t>0&&(t--,e=this._filterStack[t],e.skip););return e}_pushFilterData(){let e=this._filterStack[this._filterStackIndex];return e||=this._filterStack[this._filterStackIndex]=new Me,this._filterStackIndex++,e}};G.extension={type:[m.WebGLSystem,m.WebGPUSystem],name:`filter`};var K=class e extends x{constructor(...t){let n=t[0]??{};n instanceof Float32Array&&(_(b,`use new MeshGeometry({ positions, uvs, indices }) instead`),n={positions:n,uvs:t[1],indices:t[2]}),n={...e.defaultOptions,...n};let r=n.positions||new Float32Array([0,0,1,0,1,1,0,1]),i=n.uvs;i||=n.positions?new Float32Array(r.length):new Float32Array([0,0,1,0,1,1,0,1]);let a=n.indices||new Uint32Array([0,1,2,0,2,3]),o=n.shrinkBuffersToFit,s=new f({data:r,label:`attribute-mesh-positions`,shrinkToFit:o,usage:k.VERTEX|k.COPY_DST}),c=new f({data:i,label:`attribute-mesh-uvs`,shrinkToFit:o,usage:k.VERTEX|k.COPY_DST}),l=new f({data:a,label:`index-mesh-buffer`,shrinkToFit:o,usage:k.INDEX|k.COPY_DST});super({attributes:{aPosition:{buffer:s,format:`float32x2`,stride:8,offset:0},aUV:{buffer:c,format:`float32x2`,stride:8,offset:0}},indexBuffer:l,topology:n.topology}),this.batchMode=`auto`}get positions(){return this.attributes.aPosition.buffer.data}set positions(e){this.attributes.aPosition.buffer.data=e}get uvs(){return this.attributes.aUV.buffer.data}set uvs(e){this.attributes.aUV.buffer.data=e}get indices(){return this.indexBuffer.data}set indices(e){this.indexBuffer.data=e}};K.defaultOptions={topology:`triangle-list`,shrinkBuffersToFit:!1};var q=K,J=`http://www.w3.org/2000/svg`,Ne=`http://www.w3.org/1999/xhtml`,Pe=class{constructor(){this.svgRoot=document.createElementNS(J,`svg`),this.foreignObject=document.createElementNS(J,`foreignObject`),this.domElement=document.createElementNS(Ne,`div`),this.styleElement=document.createElementNS(Ne,`style`);let{foreignObject:e,svgRoot:t,styleElement:n,domElement:r}=this;e.setAttribute(`width`,`10000`),e.setAttribute(`height`,`10000`),e.style.overflow=`hidden`,t.appendChild(e),e.appendChild(n),e.appendChild(r),this.image=o.get().createImage()}destroy(){this.svgRoot.remove(),this.foreignObject.remove(),this.styleElement.remove(),this.domElement.remove(),this.image.src=``,this.image.remove(),this.svgRoot=null,this.foreignObject=null,this.styleElement=null,this.domElement=null,this.image=null,this.canvasAndContext=null}},Fe;function Ie(e,t,n,r){r||=Fe||=new Pe;let{domElement:i,styleElement:a,svgRoot:o}=r;i.innerHTML=`<style>${t.cssStyle};</style><div style='padding:0'>${e}</div>`,i.setAttribute(`style`,`transform-origin: top left; display: inline-block`),n&&(a.textContent=n),document.body.appendChild(o);let s=i.getBoundingClientRect();o.remove();let c=t.padding*2;return{width:s.width-c,height:s.height-c}}var Le=class{constructor(){this.batches=[],this.batched=!1}destroy(){this.batches.forEach(e=>{u.return(e)}),this.batches.length=0}},Re=class{constructor(e,t){this.state=d.for2d(),this.renderer=e,this._adaptor=t,this.renderer.runners.contextChange.add(this)}contextChange(){this._adaptor.contextChange(this.renderer)}validateRenderable(e){let t=e.context,n=!!e._gpuData,r=this.renderer.graphicsContext.updateGpuContext(t);return!!(r.isBatchable||n!==r.isBatchable)}addRenderable(e,t){let n=this.renderer.graphicsContext.updateGpuContext(e.context);e.didViewUpdate&&this._rebuild(e),n.isBatchable?this._addToBatcher(e,t):(this.renderer.renderPipes.batch.break(t),t.add(e))}updateRenderable(e){let t=this._getGpuDataForRenderable(e).batches;for(let e=0;e<t.length;e++){let n=t[e];n._batcher.updateElement(n)}}execute(e){if(!e.isRenderable)return;let t=this.renderer,n=e.context;if(!t.graphicsContext.getGpuContext(n).batches.length)return;let r=n.customShader||this._adaptor.shader;this.state.blendMode=e.groupBlendMode;let i=r.resources.localUniforms.uniforms;i.uTransformMatrix=e.groupTransform,i.uRound=t._roundPixels|e._roundPixels,O(e.groupColorAlpha,i.uColor,0),this._adaptor.execute(this,e)}_rebuild(e){let t=this._getGpuDataForRenderable(e),n=this.renderer.graphicsContext.updateGpuContext(e.context);t.destroy(),n.isBatchable&&this._updateBatchesForRenderable(e,t)}_addToBatcher(e,t){let n=this.renderer.renderPipes.batch,r=this._getGpuDataForRenderable(e).batches;for(let e=0;e<r.length;e++){let i=r[e];n.addToBatch(i,t)}}_getGpuDataForRenderable(e){return e._gpuData[this.renderer.uid]||this._initGpuDataForRenderable(e)}_initGpuDataForRenderable(e){let t=new Le;return e._gpuData[this.renderer.uid]=t,t}_updateBatchesForRenderable(e,t){let n=e.context,r=this.renderer.graphicsContext.getGpuContext(n),i=this.renderer._roundPixels|e._roundPixels;t.batches=r.batches.map(t=>{let n=u.get(ye);return t.copyTo(n),n.renderable=e,n.roundPixels=i,n})}destroy(){this.renderer=null,this._adaptor.destroy(),this._adaptor=null,this.state=null}};Re.extension={type:[m.WebGLPipes,m.WebGPUPipes,m.CanvasPipes],name:`graphics`};var ze=class e extends q{constructor(...e){super({});let t=e[0]??{};typeof t==`number`&&(_(b,`PlaneGeometry constructor changed please use { width, height, verticesX, verticesY } instead`),t={width:t,height:e[1],verticesX:e[2],verticesY:e[3]}),this.build(t)}build(t){t={...e.defaultOptions,...t},this.verticesX=this.verticesX??t.verticesX,this.verticesY=this.verticesY??t.verticesY,this.width=this.width??t.width,this.height=this.height??t.height;let n=this.verticesX*this.verticesY,r=[],i=[],a=[],o=this.verticesX-1,s=this.verticesY-1,c=this.width/o,l=this.height/s;for(let e=0;e<n;e++){let t=e%this.verticesX,n=e/this.verticesX|0;r.push(t*c,n*l),i.push(t/o,n/s)}let u=o*s;for(let e=0;e<u;e++){let t=e%o,n=e/o|0,r=n*this.verticesX+t,i=n*this.verticesX+t+1,s=(n+1)*this.verticesX+t,c=(n+1)*this.verticesX+t+1;a.push(r,i,s,i,c,s)}this.buffers[0].data=new Float32Array(r),this.buffers[1].data=new Float32Array(i),this.indexBuffer.data=new Uint32Array(a),this.buffers[0].update(),this.buffers[1].update(),this.indexBuffer.update()}};ze.defaultOptions={width:100,height:100,verticesX:10,verticesY:10};var Be=ze,Y=class{constructor(){this.batcherName=`default`,this.packAsQuad=!1,this.indexOffset=0,this.attributeOffset=0,this.roundPixels=0,this._batcher=null,this._batch=null,this._textureMatrixUpdateId=-1,this._uvUpdateId=-1}get blendMode(){return this.renderable.groupBlendMode}get topology(){return this._topology||this.geometry.topology}set topology(e){this._topology=e}reset(){this.renderable=null,this.texture=null,this._batcher=null,this._batch=null,this.geometry=null,this._uvUpdateId=-1,this._textureMatrixUpdateId=-1}setTexture(e){this.texture!==e&&(this.texture=e,this._textureMatrixUpdateId=-1)}get uvs(){let e=this.geometry.getBuffer(`aUV`),t=e.data,n=t,r=this.texture.textureMatrix;return r.isSimple||(n=this._transformedUvs,(this._textureMatrixUpdateId!==r._updateID||this._uvUpdateId!==e._updateID)&&((!n||n.length<t.length)&&(n=this._transformedUvs=new Float32Array(t.length)),this._textureMatrixUpdateId=r._updateID,this._uvUpdateId=e._updateID,r.multiplyUvs(t,n))),n}get positions(){return this.geometry.positions}get indices(){return this.geometry.indices}get color(){return this.renderable.groupColorAlpha}get groupTransform(){return this.renderable.groupTransform}get attributeSize(){return this.geometry.positions.length/2}get indexSize(){return this.geometry.indices.length}},Ve=class{destroy(){}},He=class{constructor(e,t){this.localUniforms=new E({uTransformMatrix:{value:new S,type:`mat3x3<f32>`},uColor:{value:new Float32Array([1,1,1,1]),type:`vec4<f32>`},uRound:{value:0,type:`f32`}}),this.localUniformsBindGroup=new c({0:this.localUniforms}),this.renderer=e,this._adaptor=t,this._adaptor.init()}validateRenderable(e){let t=this._getMeshData(e),n=t.batched,r=e.batched;if(t.batched=r,n!==r)return!0;if(r){let n=e._geometry;if(n.indices.length!==t.indexSize||n.positions.length!==t.vertexSize)return t.indexSize=n.indices.length,t.vertexSize=n.positions.length,!0;let r=this._getBatchableMesh(e);return r.texture.uid!==e._texture.uid&&(r._textureMatrixUpdateId=-1),!r._batcher.checkAndUpdateTexture(r,e._texture)}return!1}addRenderable(e,t){let n=this.renderer.renderPipes.batch,r=this._getMeshData(e);if(e.didViewUpdate&&(r.indexSize=e._geometry.indices?.length,r.vertexSize=e._geometry.positions?.length),r.batched){let r=this._getBatchableMesh(e);r.setTexture(e._texture),r.geometry=e._geometry,n.addToBatch(r,t)}else n.break(t),t.add(e)}updateRenderable(e){if(e.batched){let t=this._getBatchableMesh(e);t.setTexture(e._texture),t.geometry=e._geometry,t._batcher.updateElement(t)}}execute(e){if(!e.isRenderable)return;e.state.blendMode=p(e.groupBlendMode,e.texture._source);let t=this.localUniforms;t.uniforms.uTransformMatrix=e.groupTransform,t.uniforms.uRound=this.renderer._roundPixels|e._roundPixels,t.update(),O(e.groupColorAlpha,t.uniforms.uColor,0),this._adaptor.execute(this,e)}_getMeshData(e){var t,n;return(t=e._gpuData)[n=this.renderer.uid]||(t[n]=new Ve),e._gpuData[this.renderer.uid].meshData||this._initMeshData(e)}_initMeshData(e){return e._gpuData[this.renderer.uid].meshData={batched:e.batched,indexSize:0,vertexSize:0},e._gpuData[this.renderer.uid].meshData}_getBatchableMesh(e){var t,n;return(t=e._gpuData)[n=this.renderer.uid]||(t[n]=new Ve),e._gpuData[this.renderer.uid].batchableMesh||this._initBatchableMesh(e)}_initBatchableMesh(e){let t=new Y;return t.renderable=e,t.setTexture(e._texture),t.transform=e.groupTransform,t.roundPixels=this.renderer._roundPixels|e._roundPixels,e._gpuData[this.renderer.uid].batchableMesh=t,t}destroy(){this.localUniforms=null,this.localUniformsBindGroup=null,this._adaptor.destroy(),this._adaptor=null,this.renderer=null}};He.extension={type:[m.WebGLPipes,m.WebGPUPipes,m.CanvasPipes],name:`mesh`};var Ue=class{execute(e,t){let n=e.state,r=e.renderer,i=t.shader||e.defaultShader;i.resources.uTexture=t.texture._source,i.resources.uniforms=e.localUniforms;let a=r.gl,o=e.getBuffers(t);r.shader.bind(i),r.state.set(n),r.geometry.bind(o.geometry,i.glProgram);let s=o.geometry.indexBuffer.data.BYTES_PER_ELEMENT===2?a.UNSIGNED_SHORT:a.UNSIGNED_INT;a.drawElements(a.TRIANGLES,t.particleChildren.length*6,s,0)}},We=class{execute(e,t){let n=e.renderer,r=t.shader||e.defaultShader;r.groups[0]=n.renderPipes.uniformBatch.getUniformBindGroup(e.localUniforms,!0),r.groups[1]=n.texture.getTextureBindGroup(t.texture);let i=e.state,a=e.getBuffers(t);n.encoder.draw({geometry:a.geometry,shader:t.shader||e.defaultShader,state:i,size:t.particleChildren.length*6})}};function Ge(e,t=null){let n=e*6;if(t||=n>65535?new Uint32Array(n):new Uint16Array(n),t.length!==n)throw Error(`Out buffer length is incorrect, got ${t.length} and expected ${n}`);for(let e=0,r=0;e<n;e+=6,r+=4)t[e+0]=r+0,t[e+1]=r+1,t[e+2]=r+2,t[e+3]=r+0,t[e+4]=r+2,t[e+5]=r+3;return t}function Ke(e){return{dynamicUpdate:qe(e,!0),staticUpdate:qe(e,!1)}}function qe(e,t){let n=[];n.push(`

        var index = 0;

        for (let i = 0; i < ps.length; ++i)
        {
            const p = ps[i];

            `);let r=0;for(let i in e){let a=e[i];if(t!==a.dynamic)continue;n.push(`offset = index + ${r}`),n.push(a.code);let o=T(a.format);r+=o.stride/4}n.push(`
            index += stride * 4;
        }
    `),n.unshift(`
        var stride = ${r};
    `);let i=n.join(`
`);return Function(`ps`,`f32v`,`u32v`,i)}var Je=class{constructor(e){this._size=0,this._generateParticleUpdateCache={};let n=this._size=e.size??1e3,r=e.properties,i=0,a=0;for(let e in r){let t=r[e],n=T(t.format);t.dynamic?a+=n.stride:i+=n.stride}this._dynamicStride=a/4,this._staticStride=i/4,this.staticAttributeBuffer=new t(n*4*i),this.dynamicAttributeBuffer=new t(n*4*a),this.indexBuffer=Ge(n);let o=new x,s=0,c=0;this._staticBuffer=new f({data:new Float32Array(1),label:`static-particle-buffer`,shrinkToFit:!1,usage:k.VERTEX|k.COPY_DST}),this._dynamicBuffer=new f({data:new Float32Array(1),label:`dynamic-particle-buffer`,shrinkToFit:!1,usage:k.VERTEX|k.COPY_DST});for(let e in r){let t=r[e],n=T(t.format);t.dynamic?(o.addAttribute(t.attributeName,{buffer:this._dynamicBuffer,stride:this._dynamicStride*4,offset:s*4,format:t.format}),s+=n.size):(o.addAttribute(t.attributeName,{buffer:this._staticBuffer,stride:this._staticStride*4,offset:c*4,format:t.format}),c+=n.size)}o.addIndex(this.indexBuffer);let l=this.getParticleUpdate(r);this._dynamicUpload=l.dynamicUpdate,this._staticUpload=l.staticUpdate,this.geometry=o}getParticleUpdate(e){let t=Ye(e);return this._generateParticleUpdateCache[t]||(this._generateParticleUpdateCache[t]=this.generateParticleUpdate(e)),this._generateParticleUpdateCache[t]}generateParticleUpdate(e){return Ke(e)}update(e,n){e.length>this._size&&(n=!0,this._size=Math.max(e.length,this._size*1.5|0),this.staticAttributeBuffer=new t(this._size*this._staticStride*4*4),this.dynamicAttributeBuffer=new t(this._size*this._dynamicStride*4*4),this.indexBuffer=Ge(this._size),this.geometry.indexBuffer.setDataWithSize(this.indexBuffer,this.indexBuffer.byteLength,!0));let r=this.dynamicAttributeBuffer;if(this._dynamicUpload(e,r.float32View,r.uint32View),this._dynamicBuffer.setDataWithSize(this.dynamicAttributeBuffer.float32View,e.length*this._dynamicStride*4,!0),n){let t=this.staticAttributeBuffer;this._staticUpload(e,t.float32View,t.uint32View),this._staticBuffer.setDataWithSize(t.float32View,e.length*this._staticStride*4,!0)}}destroy(){this._staticBuffer.destroy(),this._dynamicBuffer.destroy(),this.geometry.destroy()}};function Ye(e){let t=[];for(let n in e){let r=e[n];t.push(n,r.code,r.dynamic?`d`:`s`)}return t.join(`_`)}var Xe=`varying vec2 vUV;
varying vec4 vColor;

uniform sampler2D uTexture;

void main(void){
    vec4 color = texture2D(uTexture, vUV) * vColor;
    gl_FragColor = color;
}`,Ze=`attribute vec2 aVertex;
attribute vec2 aUV;
attribute vec4 aColor;

attribute vec2 aPosition;
attribute float aRotation;

uniform mat3 uTranslationMatrix;
uniform float uRound;
uniform vec2 uResolution;
uniform vec4 uColor;

varying vec2 vUV;
varying vec4 vColor;

vec2 roundPixels(vec2 position, vec2 targetSize)
{       
    return (floor(((position * 0.5 + 0.5) * targetSize) + 0.5) / targetSize) * 2.0 - 1.0;
}

void main(void){
    float cosRotation = cos(aRotation);
    float sinRotation = sin(aRotation);
    float x = aVertex.x * cosRotation - aVertex.y * sinRotation;
    float y = aVertex.x * sinRotation + aVertex.y * cosRotation;

    vec2 v = vec2(x, y);
    v = v + aPosition;

    gl_Position = vec4((uTranslationMatrix * vec3(v, 1.0)).xy, 0.0, 1.0);

    if(uRound == 1.0)
    {
        gl_Position.xy = roundPixels(gl_Position.xy, uResolution);
    }

    vUV = aUV;
    vColor = vec4(aColor.rgb * aColor.a, aColor.a) * uColor;
}
`,Qe=`
struct ParticleUniforms {
  uTranslationMatrix:mat3x3<f32>,
  uColor:vec4<f32>,
  uRound:f32,
  uResolution:vec2<f32>,
};

fn roundPixels(position: vec2<f32>, targetSize: vec2<f32>) -> vec2<f32>
{
  return (floor(((position * 0.5 + 0.5) * targetSize) + 0.5) / targetSize) * 2.0 - 1.0;
}

@group(0) @binding(0) var<uniform> uniforms: ParticleUniforms;

@group(1) @binding(0) var uTexture: texture_2d<f32>;
@group(1) @binding(1) var uSampler : sampler;

struct VSOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv : vec2<f32>,
    @location(1) color : vec4<f32>,
  };
@vertex
fn mainVertex(
  @location(0) aVertex: vec2<f32>,
  @location(1) aPosition: vec2<f32>,
  @location(2) aUV: vec2<f32>,
  @location(3) aColor: vec4<f32>,
  @location(4) aRotation: f32,
) -> VSOutput {
  
   let v = vec2(
       aVertex.x * cos(aRotation) - aVertex.y * sin(aRotation),
       aVertex.x * sin(aRotation) + aVertex.y * cos(aRotation)
   ) + aPosition;

   var position = vec4((uniforms.uTranslationMatrix * vec3(v, 1.0)).xy, 0.0, 1.0);

   if(uniforms.uRound == 1.0) {
       position = vec4(roundPixels(position.xy, uniforms.uResolution), position.zw);
   }

    let vColor = vec4(aColor.rgb * aColor.a, aColor.a) * uniforms.uColor;

  return VSOutput(
   position,
   aUV,
   vColor,
  );
}

@fragment
fn mainFragment(
  @location(0) uv: vec2<f32>,
  @location(1) color: vec4<f32>,
  @builtin(position) position: vec4<f32>,
) -> @location(0) vec4<f32> {

    var sample = textureSample(uTexture, uSampler, uv) * color;
   
    return sample;
}`,$e=class extends r{constructor(){let t=s.from({vertex:Ze,fragment:Xe}),n=e.from({fragment:{source:Qe,entryPoint:`mainFragment`},vertex:{source:Qe,entryPoint:`mainVertex`}});super({glProgram:t,gpuProgram:n,resources:{uTexture:w.WHITE.source,uSampler:new g({}),uniforms:{uTranslationMatrix:{value:new S,type:`mat3x3<f32>`},uColor:{value:new ue(16777215),type:`vec4<f32>`},uRound:{value:1,type:`f32`},uResolution:{value:[0,0],type:`vec2<f32>`}}}})}},et=class{constructor(e,t){this.state=d.for2d(),this.localUniforms=new E({uTranslationMatrix:{value:new S,type:`mat3x3<f32>`},uColor:{value:new Float32Array(4),type:`vec4<f32>`},uRound:{value:1,type:`f32`},uResolution:{value:[0,0],type:`vec2<f32>`}}),this.renderer=e,this.adaptor=t,this.defaultShader=new $e,this.state=d.for2d()}validateRenderable(e){return!1}addRenderable(e,t){this.renderer.renderPipes.batch.break(t),t.add(e)}getBuffers(e){return e._gpuData[this.renderer.uid]||this._initBuffer(e)}_initBuffer(e){return e._gpuData[this.renderer.uid]=new Je({size:e.particleChildren.length,properties:e._properties}),e._gpuData[this.renderer.uid]}updateRenderable(e){}execute(e){let t=e.particleChildren;if(t.length===0)return;let n=this.renderer,r=this.getBuffers(e);e.texture||=t[0].texture;let i=this.state;r.update(t,e._childrenDirty),e._childrenDirty=!1,i.blendMode=p(e.blendMode,e.texture._source);let a=this.localUniforms.uniforms,o=a.uTranslationMatrix;e.worldTransform.copyTo(o),o.prepend(n.globalUniforms.globalUniformData.projectionMatrix),a.uResolution=n.globalUniforms.globalUniformData.resolution,a.uRound=n._roundPixels|e._roundPixels,O(e.groupColorAlpha,a.uColor,0),this.adaptor.execute(this,e)}destroy(){this.renderer=null,this.defaultShader&&=(this.defaultShader.destroy(),null)}},tt=class extends et{constructor(e){super(e,new Ue)}};tt.extension={type:[m.WebGLPipes],name:`particle`};var nt=class extends et{constructor(e){super(e,new We)}};nt.extension={type:[m.WebGPUPipes],name:`particle`};var rt=class e extends Be{constructor(t={}){t={...e.defaultOptions,...t},super({width:t.width,height:t.height,verticesX:4,verticesY:4}),this.update(t)}update(e){this.width=e.width??this.width,this.height=e.height??this.height,this._originalWidth=e.originalWidth??this._originalWidth,this._originalHeight=e.originalHeight??this._originalHeight,this._leftWidth=e.leftWidth??this._leftWidth,this._rightWidth=e.rightWidth??this._rightWidth,this._topHeight=e.topHeight??this._topHeight,this._bottomHeight=e.bottomHeight??this._bottomHeight,this._anchorX=e.anchor?.x,this._anchorY=e.anchor?.y,this.updateUvs(),this.updatePositions()}updatePositions(){let e=this.positions,{width:t,height:n,_leftWidth:r,_rightWidth:i,_topHeight:a,_bottomHeight:o,_anchorX:s,_anchorY:c}=this,l=r+i,u=t>l?1:t/l,d=a+o,f=n>d?1:n/d,p=Math.min(u,f),m=s*t,h=c*n;e[0]=e[8]=e[16]=e[24]=-m,e[2]=e[10]=e[18]=e[26]=r*p-m,e[4]=e[12]=e[20]=e[28]=t-i*p-m,e[6]=e[14]=e[22]=e[30]=t-m,e[1]=e[3]=e[5]=e[7]=-h,e[9]=e[11]=e[13]=e[15]=a*p-h,e[17]=e[19]=e[21]=e[23]=n-o*p-h,e[25]=e[27]=e[29]=e[31]=n-h,this.getBuffer(`aPosition`).update()}updateUvs(){let e=this.uvs;e[0]=e[8]=e[16]=e[24]=0,e[1]=e[3]=e[5]=e[7]=0,e[6]=e[14]=e[22]=e[30]=1,e[25]=e[27]=e[29]=e[31]=1;let t=1/this._originalWidth,n=1/this._originalHeight;e[2]=e[10]=e[18]=e[26]=t*this._leftWidth,e[9]=e[11]=e[13]=e[15]=n*this._topHeight,e[4]=e[12]=e[20]=e[28]=1-t*this._rightWidth,e[17]=e[19]=e[21]=e[23]=1-n*this._bottomHeight,this.getBuffer(`aUV`).update()}};rt.defaultOptions={width:100,height:100,leftWidth:10,topHeight:10,rightWidth:10,bottomHeight:10,originalWidth:100,originalHeight:100};var it=rt,at=class extends Y{constructor(){super(),this.geometry=new it}destroy(){this.geometry.destroy()}},ot=class{constructor(e){this._renderer=e}addRenderable(e,t){let n=this._getGpuSprite(e);e.didViewUpdate&&this._updateBatchableSprite(e,n),this._renderer.renderPipes.batch.addToBatch(n,t)}updateRenderable(e){let t=this._getGpuSprite(e);e.didViewUpdate&&this._updateBatchableSprite(e,t),t._batcher.updateElement(t)}validateRenderable(e){let t=this._getGpuSprite(e);return!t._batcher.checkAndUpdateTexture(t,e._texture)}_updateBatchableSprite(e,t){t.geometry.update(e),t.setTexture(e._texture)}_getGpuSprite(e){return e._gpuData[this._renderer.uid]||this._initGPUSprite(e)}_initGPUSprite(e){let t=e._gpuData[this._renderer.uid]=new at,n=t;return n.renderable=e,n.transform=e.groupTransform,n.texture=e._texture,n.roundPixels=this._renderer._roundPixels|e._roundPixels,e.didViewUpdate||this._updateBatchableSprite(e,n),t}destroy(){this._renderer=null}};ot.extension={type:[m.WebGLPipes,m.WebGPUPipes,m.CanvasPipes],name:`nineSliceSprite`};var st={name:`tiling-bit`,vertex:{header:`
            struct TilingUniforms {
                uMapCoord:mat3x3<f32>,
                uClampFrame:vec4<f32>,
                uClampOffset:vec2<f32>,
                uTextureTransform:mat3x3<f32>,
                uSizeAnchor:vec4<f32>
            };

            @group(2) @binding(0) var<uniform> tilingUniforms: TilingUniforms;
            @group(2) @binding(1) var uTexture: texture_2d<f32>;
            @group(2) @binding(2) var uSampler: sampler;
        `,main:`
            uv = (tilingUniforms.uTextureTransform * vec3(uv, 1.0)).xy;

            position = (position - tilingUniforms.uSizeAnchor.zw) * tilingUniforms.uSizeAnchor.xy;
        `},fragment:{header:`
            struct TilingUniforms {
                uMapCoord:mat3x3<f32>,
                uClampFrame:vec4<f32>,
                uClampOffset:vec2<f32>,
                uTextureTransform:mat3x3<f32>,
                uSizeAnchor:vec4<f32>
            };

            @group(2) @binding(0) var<uniform> tilingUniforms: TilingUniforms;
            @group(2) @binding(1) var uTexture: texture_2d<f32>;
            @group(2) @binding(2) var uSampler: sampler;
        `,main:`

            var coord = vUV + ceil(tilingUniforms.uClampOffset - vUV);
            coord = (tilingUniforms.uMapCoord * vec3(coord, 1.0)).xy;
            var unclamped = coord;
            coord = clamp(coord, tilingUniforms.uClampFrame.xy, tilingUniforms.uClampFrame.zw);

            var bias = 0.;

            if(unclamped.x == coord.x && unclamped.y == coord.y)
            {
                bias = -32.;
            }

            outColor = textureSampleBias(uTexture, uSampler, coord, bias);
        `}},ct={name:`tiling-bit`,vertex:{header:`
            uniform mat3 uTextureTransform;
            uniform vec4 uSizeAnchor;

        `,main:`
            uv = (uTextureTransform * vec3(aUV, 1.0)).xy;

            position = (position - uSizeAnchor.zw) * uSizeAnchor.xy;
        `},fragment:{header:`
            uniform sampler2D uTexture;
            uniform mat3 uMapCoord;
            uniform vec4 uClampFrame;
            uniform vec2 uClampOffset;
        `,main:`

        vec2 coord = vUV + ceil(uClampOffset - vUV);
        coord = (uMapCoord * vec3(coord, 1.0)).xy;
        vec2 unclamped = coord;
        coord = clamp(coord, uClampFrame.xy, uClampFrame.zw);

        outColor = texture(uTexture, coord, unclamped == coord ? 0.0 : -32.0);// lod-bias very negative to force lod 0

        `}},lt,ut,dt=class extends r{constructor(){lt??=C({name:`tiling-sprite-shader`,bits:[se,st,h]}),ut??=re({name:`tiling-sprite-shader`,bits:[ne,ct,D]});let e=new E({uMapCoord:{value:new S,type:`mat3x3<f32>`},uClampFrame:{value:new Float32Array([0,0,1,1]),type:`vec4<f32>`},uClampOffset:{value:new Float32Array([0,0]),type:`vec2<f32>`},uTextureTransform:{value:new S,type:`mat3x3<f32>`},uSizeAnchor:{value:new Float32Array([100,100,.5,.5]),type:`vec4<f32>`}});super({glProgram:ut,gpuProgram:lt,resources:{localUniforms:new E({uTransformMatrix:{value:new S,type:`mat3x3<f32>`},uColor:{value:new Float32Array([1,1,1,1]),type:`vec4<f32>`},uRound:{value:0,type:`f32`}}),tilingUniforms:e,uTexture:w.EMPTY.source,uSampler:w.EMPTY.source.style}})}updateUniforms(e,t,n,r,i,a){let o=this.resources.tilingUniforms,s=a.width,c=a.height,l=a.textureMatrix,u=o.uniforms.uTextureTransform;u.set(n.a*s/e,n.b*s/t,n.c*c/e,n.d*c/t,n.tx/e,n.ty/t),u.invert(),o.uniforms.uMapCoord=l.mapCoord,o.uniforms.uClampFrame=l.uClampFrame,o.uniforms.uClampOffset=l.uClampOffset,o.uniforms.uTextureTransform=u,o.uniforms.uSizeAnchor[0]=e,o.uniforms.uSizeAnchor[1]=t,o.uniforms.uSizeAnchor[2]=r,o.uniforms.uSizeAnchor[3]=i,a&&(this.resources.uTexture=a.source,this.resources.uSampler=a.source.style)}},ft=class extends q{constructor(){super({positions:new Float32Array([0,0,1,0,1,1,0,1]),uvs:new Float32Array([0,0,1,0,1,1,0,1]),indices:new Uint32Array([0,1,2,0,2,3])})}};function pt(e,t){let n=e.anchor.x,r=e.anchor.y;t[0]=-n*e.width,t[1]=-r*e.height,t[2]=(1-n)*e.width,t[3]=-r*e.height,t[4]=(1-n)*e.width,t[5]=(1-r)*e.height,t[6]=-n*e.width,t[7]=(1-r)*e.height}function mt(e,t,n,r){let i=0,a=e.length/(t||2),o=r.a,s=r.b,c=r.c,l=r.d,u=r.tx,d=r.ty;for(n*=t;i<a;){let r=e[n],a=e[n+1];e[n]=o*r+c*a+u,e[n+1]=s*r+l*a+d,n+=t,i++}}function ht(e,t){let n=e.texture,r=n.frame.width,i=n.frame.height,a=0,o=0;e.applyAnchorToTexture&&(a=e.anchor.x,o=e.anchor.y),t[0]=t[6]=-a,t[2]=t[4]=1-a,t[1]=t[3]=-o,t[5]=t[7]=1-o;let s=S.shared;s.copyFrom(e._tileTransform.matrix),s.tx/=e.width,s.ty/=e.height,s.invert(),s.scale(e.width/r,e.height/i),mt(t,2,0,s)}var X=new ft,gt=class{constructor(){this.canBatch=!0,this.geometry=new q({indices:X.indices.slice(),positions:X.positions.slice(),uvs:X.uvs.slice()})}destroy(){this.geometry.destroy(),this.shader?.destroy()}},_t=class{constructor(e){this._state=d.default2d,this._renderer=e}validateRenderable(e){let t=this._getTilingSpriteData(e),n=t.canBatch;this._updateCanBatch(e);let r=t.canBatch;if(r&&r===n){let{batchableMesh:n}=t;return!n._batcher.checkAndUpdateTexture(n,e.texture)}return n!==r}addRenderable(e,t){let n=this._renderer.renderPipes.batch;this._updateCanBatch(e);let r=this._getTilingSpriteData(e),{geometry:i,canBatch:a}=r;if(a){r.batchableMesh||=new Y;let a=r.batchableMesh;e.didViewUpdate&&(this._updateBatchableMesh(e),a.geometry=i,a.renderable=e,a.transform=e.groupTransform,a.setTexture(e._texture)),a.roundPixels=this._renderer._roundPixels|e._roundPixels,n.addToBatch(a,t)}else n.break(t),r.shader||=new dt,this.updateRenderable(e),t.add(e)}execute(e){let{shader:t}=this._getTilingSpriteData(e);t.groups[0]=this._renderer.globalUniforms.bindGroup;let n=t.resources.localUniforms.uniforms;n.uTransformMatrix=e.groupTransform,n.uRound=this._renderer._roundPixels|e._roundPixels,O(e.groupColorAlpha,n.uColor,0),this._state.blendMode=p(e.groupBlendMode,e.texture._source),this._renderer.encoder.draw({geometry:X,shader:t,state:this._state})}updateRenderable(e){let t=this._getTilingSpriteData(e),{canBatch:n}=t;if(n){let{batchableMesh:n}=t;e.didViewUpdate&&this._updateBatchableMesh(e),n._batcher.updateElement(n)}else if(e.didViewUpdate){let{shader:n}=t;n.updateUniforms(e.width,e.height,e._tileTransform.matrix,e.anchor.x,e.anchor.y,e.texture)}}_getTilingSpriteData(e){return e._gpuData[this._renderer.uid]||this._initTilingSpriteData(e)}_initTilingSpriteData(e){let t=new gt;return t.renderable=e,e._gpuData[this._renderer.uid]=t,t}_updateBatchableMesh(e){let{geometry:t}=this._getTilingSpriteData(e),n=e.texture.source.style;n.addressMode!==`repeat`&&(n.addressMode=`repeat`,n.update()),ht(e,t.uvs),pt(e,t.positions)}destroy(){this._renderer=null}_updateCanBatch(e){let t=this._getTilingSpriteData(e),r=e.texture,i=!0;return this._renderer.type===n.WEBGL&&(i=this._renderer.context.supports.nonPowOf2wrapping),t.canBatch=r.textureMatrix.isSimple&&(i||r.source.isPowerOfTwo),t.canBatch}};_t.extension={type:[m.WebGLPipes,m.WebGPUPipes,m.CanvasPipes],name:`tilingSprite`};var vt={name:`local-uniform-msdf-bit`,vertex:{header:`
            struct LocalUniforms {
                uColor:vec4<f32>,
                uTransformMatrix:mat3x3<f32>,
                uDistance: f32,
                uRound:f32,
            }

            @group(2) @binding(0) var<uniform> localUniforms : LocalUniforms;
        `,main:`
            vColor *= localUniforms.uColor;
            modelMatrix *= localUniforms.uTransformMatrix;
        `,end:`
            if(localUniforms.uRound == 1)
            {
                vPosition = vec4(roundPixels(vPosition.xy, globalUniforms.uResolution), vPosition.zw);
            }
        `},fragment:{header:`
            struct LocalUniforms {
                uColor:vec4<f32>,
                uTransformMatrix:mat3x3<f32>,
                uDistance: f32
            }

            @group(2) @binding(0) var<uniform> localUniforms : LocalUniforms;
         `,main:`
            outColor = vec4<f32>(calculateMSDFAlpha(outColor, localUniforms.uColor, localUniforms.uDistance));
        `}},yt={name:`local-uniform-msdf-bit`,vertex:{header:`
            uniform mat3 uTransformMatrix;
            uniform vec4 uColor;
            uniform float uRound;
        `,main:`
            vColor *= uColor;
            modelMatrix *= uTransformMatrix;
        `,end:`
            if(uRound == 1.)
            {
                gl_Position.xy = roundPixels(gl_Position.xy, uResolution);
            }
        `},fragment:{header:`
            uniform float uDistance;
         `,main:`
            outColor = vec4(calculateMSDFAlpha(outColor, vColor, uDistance));
        `}},bt={name:`msdf-bit`,fragment:{header:`
            fn calculateMSDFAlpha(msdfColor:vec4<f32>, shapeColor:vec4<f32>, distance:f32) -> f32 {

                // MSDF
                var median = msdfColor.r + msdfColor.g + msdfColor.b -
                    min(msdfColor.r, min(msdfColor.g, msdfColor.b)) -
                    max(msdfColor.r, max(msdfColor.g, msdfColor.b));

                // SDF
                median = min(median, msdfColor.a);

                var screenPxDistance = distance * (median - 0.5);
                var alpha = clamp(screenPxDistance + 0.5, 0.0, 1.0);
                if (median < 0.01) {
                    alpha = 0.0;
                } else if (median > 0.99) {
                    alpha = 1.0;
                }

                // Gamma correction for coverage-like alpha
                var luma: f32 = dot(shapeColor.rgb, vec3<f32>(0.299, 0.587, 0.114));
                var gamma: f32 = mix(1.0, 1.0 / 2.2, luma);
                var coverage: f32 = pow(shapeColor.a * alpha, gamma);

                return coverage;

            }
        `}},xt={name:`msdf-bit`,fragment:{header:`
            float calculateMSDFAlpha(vec4 msdfColor, vec4 shapeColor, float distance) {

                // MSDF
                float median = msdfColor.r + msdfColor.g + msdfColor.b -
                                min(msdfColor.r, min(msdfColor.g, msdfColor.b)) -
                                max(msdfColor.r, max(msdfColor.g, msdfColor.b));

                // SDF
                median = min(median, msdfColor.a);

                float screenPxDistance = distance * (median - 0.5);
                float alpha = clamp(screenPxDistance + 0.5, 0.0, 1.0);

                if (median < 0.01) {
                    alpha = 0.0;
                } else if (median > 0.99) {
                    alpha = 1.0;
                }

                // Gamma correction for coverage-like alpha
                float luma = dot(shapeColor.rgb, vec3(0.299, 0.587, 0.114));
                float gamma = mix(1.0, 1.0 / 2.2, luma);
                float coverage = pow(shapeColor.a * alpha, gamma);

                return coverage;
            }
        `}},St,Ct,wt=class extends r{constructor(e){let t=new E({uColor:{value:new Float32Array([1,1,1,1]),type:`vec4<f32>`},uTransformMatrix:{value:new S,type:`mat3x3<f32>`},uDistance:{value:4,type:`f32`},uRound:{value:0,type:`f32`}});St??=C({name:`sdf-shader`,bits:[y,de(e),vt,bt,h]}),Ct??=re({name:`sdf-shader`,bits:[oe,ee(e),yt,xt,D]}),super({glProgram:Ct,gpuProgram:St,resources:{localUniforms:t,batchSamplers:le(e)}})}},Tt=class extends ge{destroy(){this.context.customShader&&this.context.customShader.destroy(),super.destroy()}},Z=class{constructor(e){this._renderer=e}validateRenderable(e){let t=this._getGpuBitmapText(e);return this._renderer.renderPipes.graphics.validateRenderable(t)}addRenderable(e,t){let n=this._getGpuBitmapText(e);Et(e,n),e._didTextUpdate&&(e._didTextUpdate=!1,this._updateContext(e,n)),this._renderer.renderPipes.graphics.addRenderable(n,t),n.context.customShader&&this._updateDistanceField(e)}updateRenderable(e){let t=this._getGpuBitmapText(e);Et(e,t),this._renderer.renderPipes.graphics.updateRenderable(t),t.context.customShader&&this._updateDistanceField(e)}_updateContext(e,t){let{context:n}=t,r=Ee.getFont(e.text,e._style);n.clear(),r.distanceField.type!==`none`&&(n.customShader||=new wt(this._renderer.limits.maxBatchableTextures));let i=j.graphemeSegmenter(e.text),a=e._style,o=r.baseLineOffset,s=B(i,a,r,!0),c=a.padding,l=s.scale,u=s.width,d=s.height+s.offsetY;a._stroke&&(u+=a._stroke.width/l,d+=a._stroke.width/l),n.translate(-e._anchor._x*u-c,-e._anchor._y*d-c).scale(l,l);let f=r.applyFillAsTint?a._fill.color:16777215,p=r.fontMetrics.fontSize,m=r.lineHeight;a.lineHeight&&(p=a.fontSize/l,m=a.lineHeight/l);let h=(m-p)/2;h-r.baseLineOffset<0&&(h=0);for(let e=0;e<s.lines.length;e++){let t=s.lines[e];for(let e=0;e<t.charPositions.length;e++){let i=t.chars[e],a=r.chars[i];if(a?.texture){let r=a.texture;n.texture(r,f||`black`,Math.round(t.charPositions[e]+a.xOffset),Math.round(o+a.yOffset+h),r.orig.width,r.orig.height)}}o+=m}}_getGpuBitmapText(e){return e._gpuData[this._renderer.uid]||this.initGpuText(e)}initGpuText(e){let t=new Tt;return e._gpuData[this._renderer.uid]=t,this._updateContext(e,t),t}_updateDistanceField(e){let t=this._getGpuBitmapText(e).context,n=e._style.fontFamily,r=M.get(`${n}-bitmap`),{a:i,b:a,c:o,d:s}=e.groupTransform,c=Math.sqrt(i*i+a*a),l=Math.sqrt(o*o+s*s),u=(Math.abs(c)+Math.abs(l))/2,d=r.baseRenderedFontSize/e._style.fontSize,f=u*r.distanceField.range*(1/d);t.customShader.resources.localUniforms.uniforms.uDistance=f}destroy(){this._renderer=null}};Z.extension={type:[m.WebGLPipes,m.WebGPUPipes,m.CanvasPipes],name:`bitmapText`};function Et(e,t){t.groupTransform=e.groupTransform,t.groupColorAlpha=e.groupColorAlpha,t.groupColor=e.groupColor,t.groupBlendMode=e.groupBlendMode,t.globalDisplayStatus=e.globalDisplayStatus,t.groupTransform=e.groupTransform,t.localDisplayStatus=e.localDisplayStatus,t.groupAlpha=e.groupAlpha,t._roundPixels=e._roundPixels}var Dt=class extends ie{constructor(e){super(),this.generatingTexture=!1,this.currentKey=`--`,this._renderer=e,e.runners.resolutionChange.add(this)}resolutionChange(){let e=this.renderable;e._autoResolution&&e.onViewUpdate()}destroy(){let{htmlText:e}=this._renderer;e.getReferenceCount(this.currentKey)===null?e.returnTexturePromise(this.texturePromise):e.decreaseReferenceCount(this.currentKey),this._renderer.runners.resolutionChange.remove(this),this.texturePromise=null,this._renderer=null}};function Q(e,t){let{texture:n,bounds:r}=e,i=t._style._getFinalPadding();ce(r,t._anchor,n);let a=t._anchor._x*i*2,o=t._anchor._y*i*2;r.minX-=i-a,r.minY-=i-o,r.maxX-=i-a,r.maxY-=i-o}var Ot=class{constructor(e){this._renderer=e}validateRenderable(e){let t=this._getGpuText(e),n=e.styleKey;return t.currentKey!==n}addRenderable(e,t){let n=this._getGpuText(e);if(e._didTextUpdate){let t=e._autoResolution?this._renderer.resolution:e.resolution;(n.currentKey!==e.styleKey||e.resolution!==t)&&this._updateGpuText(e).catch(e=>{console.error(e)}),e._didTextUpdate=!1,Q(n,e)}this._renderer.renderPipes.batch.addToBatch(n,t)}updateRenderable(e){let t=this._getGpuText(e);t._batcher.updateElement(t)}async _updateGpuText(e){e._didTextUpdate=!1;let t=this._getGpuText(e);if(t.generatingTexture)return;let n=t.texturePromise;t.texturePromise=null,t.generatingTexture=!0,e._resolution=e._autoResolution?this._renderer.resolution:e.resolution;let r=this._renderer.htmlText.getTexturePromise(e);n&&(r=r.finally(()=>{this._renderer.htmlText.decreaseReferenceCount(t.currentKey),this._renderer.htmlText.returnTexturePromise(n)})),t.texturePromise=r,t.currentKey=e.styleKey,t.texture=await r;let i=e.renderGroup||e.parentRenderGroup;i&&(i.structureDidChange=!0),t.generatingTexture=!1,Q(t,e)}_getGpuText(e){return e._gpuData[this._renderer.uid]||this.initGpuText(e)}initGpuText(e){let t=new Dt(this._renderer);return t.renderable=e,t.transform=e.groupTransform,t.texture=w.EMPTY,t.bounds={minX:0,maxX:1,minY:0,maxY:0},t.roundPixels=this._renderer._roundPixels|e._roundPixels,e._resolution=e._autoResolution?this._renderer.resolution:e.resolution,e._gpuData[this._renderer.uid]=t,t}destroy(){this._renderer=null}};Ot.extension={type:[m.WebGLPipes,m.WebGPUPipes,m.CanvasPipes],name:`htmlText`};function kt(){let{userAgent:e}=o.get().getNavigator();return/^((?!chrome|android).)*safari/i.test(e)}var At=new ae;function jt(e,t,n,r){let i=At;i.minX=0,i.minY=0,i.maxX=e.width/r|0,i.maxY=e.height/r|0;let o=a.getOptimalTexture(i.width,i.height,r,!1);return o.source.uploadMethodId=`image`,o.source.resource=e,o.source.alphaMode=`premultiply-alpha-on-upload`,o.frame.width=t/r,o.frame.height=n/r,o.source.emit(`update`,o.source),o.updateUvs(),o}function Mt(e,t){let n=t.fontFamily,r=[],i={},a=e.match(/font-family:([^;"\s]+)/g);function o(e){i[e]||(r.push(e),i[e]=!0)}if(Array.isArray(n))for(let e=0;e<n.length;e++)o(n[e]);else o(n);a&&a.forEach(e=>{o(e.split(`:`)[1].trim())});for(let e in t.tagStyles){let n=t.tagStyles[e].fontFamily;o(n)}return r}async function Nt(e){let t=await(await o.get().fetch(e)).blob(),n=new FileReader;return await new Promise((e,r)=>{n.onloadend=()=>e(n.result),n.onerror=r,n.readAsDataURL(t)})}async function Pt(e,t){let n=await Nt(t);return`@font-face {
        font-family: "${e.fontFamily}";
        font-weight: ${e.fontWeight};
        font-style: ${e.fontStyle};
        src: url('${n}');
    }`}var $=new Map;async function Ft(e){let t=e.filter(e=>M.has(`${e}-and-url`)).map(e=>{if(!$.has(e)){let{entries:t}=M.get(`${e}-and-url`),n=[];t.forEach(t=>{let r=t.url,i=t.faces.map(e=>({weight:e.weight,style:e.style}));n.push(...i.map(t=>Pt({fontWeight:t.weight,fontStyle:t.style,fontFamily:e},r)))}),$.set(e,Promise.all(n).then(e=>e.join(`
`)))}return $.get(e)});return(await Promise.all(t)).join(`
`)}function It(e,t,n,r,i){let{domElement:a,styleElement:o,svgRoot:s}=i;a.innerHTML=`<style>${t.cssStyle}</style><div style='padding:0;'>${e}</div>`,a.setAttribute(`style`,`transform: scale(${n});transform-origin: top left; display: inline-block`),o.textContent=r;let{width:c,height:l}=i.image;return s.setAttribute(`width`,c.toString()),s.setAttribute(`height`,l.toString()),new XMLSerializer().serializeToString(s)}function Lt(e,t){let n=F.getOptimalCanvasAndContext(e.width,e.height,t),{context:r}=n;return r.clearRect(0,0,e.width,e.height),r.drawImage(e,0,0),n}function Rt(e,t,n){return new Promise(async r=>{n&&await new Promise(e=>setTimeout(e,100)),e.onload=()=>{r()},e.src=`data:image/svg+xml;charset=utf8,${encodeURIComponent(t)}`,e.crossOrigin=`anonymous`})}var zt=class{constructor(e){this._activeTextures={},this._renderer=e,this._createCanvas=e.type===n.WEBGPU}getTexture(e){return this.getTexturePromise(e)}getManagedTexture(e){let t=e.styleKey;if(this._activeTextures[t])return this._increaseReferenceCount(t),this._activeTextures[t].promise;let n=this._buildTexturePromise(e).then(e=>(this._activeTextures[t].texture=e,e));return this._activeTextures[t]={texture:null,promise:n,usageCount:1},n}getReferenceCount(e){return this._activeTextures[e]?.usageCount??null}_increaseReferenceCount(e){this._activeTextures[e].usageCount++}decreaseReferenceCount(e){let t=this._activeTextures[e];t&&(t.usageCount--,t.usageCount===0&&(t.texture?this._cleanUp(t.texture):t.promise.then(e=>{t.texture=e,this._cleanUp(t.texture)}).catch(()=>{v(`HTMLTextSystem: Failed to clean texture`)}),this._activeTextures[e]=null))}getTexturePromise(e){return this._buildTexturePromise(e)}async _buildTexturePromise(e){let{text:t,style:n,resolution:r,textureStyle:i}=e,a=u.get(Pe),o=Mt(t,n),s=await Ft(o),c=Ie(t,n,s,a),l=Math.ceil(Math.ceil(Math.max(1,c.width)+n.padding*2)*r),d=Math.ceil(Math.ceil(Math.max(1,c.height)+n.padding*2)*r),f=a.image;f.width=(l|0)+2,f.height=(d|0)+2,await Rt(f,It(t,n,r,s,a),kt()&&o.length>0);let p=f,m;this._createCanvas&&(m=Lt(f,r));let h=jt(m?m.canvas:p,f.width-2,f.height-2,r);return i&&(h.source.style=i),this._createCanvas&&(this._renderer.texture.initSource(h.source),F.returnCanvasAndContext(m)),u.return(a),h}returnTexturePromise(e){e.then(e=>{this._cleanUp(e)}).catch(()=>{v(`HTMLTextSystem: Failed to clean texture`)})}_cleanUp(e){a.returnTexture(e,!0),e.source.resource=null,e.source.uploadMethodId=`unknown`}destroy(){this._renderer=null;for(let e in this._activeTextures)this._activeTextures[e]&&this.returnTexturePromise(this._activeTextures[e].promise);this._activeTextures=null}};zt.extension={type:[m.WebGLSystem,m.WebGPUSystem,m.CanvasSystem],name:`htmlText`};var Bt=class extends ie{constructor(e){super(),this._renderer=e,e.runners.resolutionChange.add(this)}resolutionChange(){let e=this.renderable;e._autoResolution&&e.onViewUpdate()}destroy(){let{canvasText:e}=this._renderer;e.getReferenceCount(this.currentKey)>0?e.decreaseReferenceCount(this.currentKey):this.texture&&e.returnTexture(this.texture),this._renderer.runners.resolutionChange.remove(this),this._renderer=null}},Vt=class{constructor(e){this._renderer=e}validateRenderable(e){let t=this._getGpuText(e),n=e.styleKey;return t.currentKey!==n||e._didTextUpdate}addRenderable(e,t){let n=this._getGpuText(e);if(e._didTextUpdate){let t=e._autoResolution?this._renderer.resolution:e.resolution;(n.currentKey!==e.styleKey||e.resolution!==t)&&this._updateGpuText(e),e._didTextUpdate=!1,Q(n,e)}this._renderer.renderPipes.batch.addToBatch(n,t)}updateRenderable(e){let t=this._getGpuText(e);t._batcher.updateElement(t)}_updateGpuText(e){let t=this._getGpuText(e);t.texture&&this._renderer.canvasText.decreaseReferenceCount(t.currentKey),e._resolution=e._autoResolution?this._renderer.resolution:e.resolution,t.texture=this._renderer.canvasText.getManagedTexture(e),t.currentKey=e.styleKey}_getGpuText(e){return e._gpuData[this._renderer.uid]||this.initGpuText(e)}initGpuText(e){let t=new Bt(this._renderer);return t.currentKey=`--`,t.renderable=e,t.transform=e.groupTransform,t.bounds={minX:0,maxX:1,minY:0,maxY:0},t.roundPixels=this._renderer._roundPixels|e._roundPixels,e._gpuData[this._renderer.uid]=t,t}destroy(){this._renderer=null}};Vt.extension={type:[m.WebGLPipes,m.WebGPUPipes,m.CanvasPipes],name:`text`};var Ht=class{constructor(e){this._activeTextures={},this._renderer=e}getTexture(e,t,n,r){typeof e==`string`&&(_(`8.0.0`,`CanvasTextSystem.getTexture: Use object TextOptions instead of separate arguments`),e={text:e,style:n,resolution:t}),e.style instanceof N||(e.style=new N(e.style)),e.textureStyle instanceof g||(e.textureStyle=new g(e.textureStyle)),typeof e.text!=`string`&&(e.text=e.text.toString());let{text:i,style:a,textureStyle:o}=e,s=e.resolution??this._renderer.resolution,{frame:c,canvasAndContext:l}=P.getCanvasAndContext({text:i,style:a,resolution:s}),u=jt(l.canvas,c.width,c.height,s);if(o&&(u.source.style=o),a.trim&&(c.pad(a.padding),u.frame.copyFrom(c),u.frame.scale(1/s),u.updateUvs()),a.filters){let e=this._applyFilters(u,a.filters);return this.returnTexture(u),P.returnCanvasAndContext(l),e}return this._renderer.texture.initSource(u._source),P.returnCanvasAndContext(l),u}returnTexture(e){let t=e.source;t.resource=null,t.uploadMethodId=`unknown`,t.alphaMode=`no-premultiply-alpha`,a.returnTexture(e,!0)}renderTextToCanvas(){_(`8.10.0`,`CanvasTextSystem.renderTextToCanvas: no longer supported, use CanvasTextSystem.getTexture instead`)}getManagedTexture(e){e._resolution=e._autoResolution?this._renderer.resolution:e.resolution;let t=e.styleKey;if(this._activeTextures[t])return this._increaseReferenceCount(t),this._activeTextures[t].texture;let n=this.getTexture({text:e.text,style:e.style,resolution:e._resolution,textureStyle:e.textureStyle});return this._activeTextures[t]={texture:n,usageCount:1},n}decreaseReferenceCount(e){let t=this._activeTextures[e];t.usageCount--,t.usageCount===0&&(this.returnTexture(t.texture),this._activeTextures[e]=null)}getReferenceCount(e){return this._activeTextures[e]?.usageCount??0}_increaseReferenceCount(e){this._activeTextures[e].usageCount++}_applyFilters(e,t){let n=this._renderer.renderTarget.renderTarget,r=this._renderer.filter.generateFilteredTexture({texture:e,filters:t});return this._renderer.renderTarget.bind(n,!1),r}destroy(){this._renderer=null;for(let e in this._activeTextures)this._activeTextures[e]&&this.returnTexture(this._activeTextures[e].texture);this._activeTextures=null}};Ht.extension={type:[m.WebGLSystem,m.WebGPUSystem,m.CanvasSystem],name:`canvasText`},A.add(I),A.add(L),A.add(Re),A.add(_e),A.add(He),A.add(tt),A.add(nt),A.add(Ht),A.add(Vt),A.add(Z),A.add(zt),A.add(Ot),A.add(_t),A.add(ot),A.add(G),A.add(U);