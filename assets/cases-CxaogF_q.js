import{r as e,t}from"./martinez-CfowInmS.js";var n=class e{constructor(t,n,r,i,a=`div`){this.parent=t,this.object=n,this.property=r,this._disabled=!1,this._hidden=!1,this.initialValue=this.getValue(),this.domElement=document.createElement(a),this.domElement.classList.add(`lil-controller`),this.domElement.classList.add(i),this.$name=document.createElement(`div`),this.$name.classList.add(`lil-name`),e.nextNameID=e.nextNameID||0,this.$name.id=`lil-gui-name-${++e.nextNameID}`,this.$widget=document.createElement(`div`),this.$widget.classList.add(`lil-widget`),this.$disable=this.$widget,this.domElement.appendChild(this.$name),this.domElement.appendChild(this.$widget),this.domElement.addEventListener(`keydown`,e=>e.stopPropagation()),this.domElement.addEventListener(`keyup`,e=>e.stopPropagation()),this.parent.children.push(this),this.parent.controllers.push(this),this.parent.$children.appendChild(this.domElement),this._listenCallback=this._listenCallback.bind(this),this.name(r)}name(e){return this._name=e,this.$name.textContent=e,this}onChange(e){return this._onChange=e,this}_callOnChange(){this.parent._callOnChange(this),this._onChange!==void 0&&this._onChange.call(this,this.getValue()),this._changed=!0}onFinishChange(e){return this._onFinishChange=e,this}_callOnFinishChange(){this._changed&&(this.parent._callOnFinishChange(this),this._onFinishChange!==void 0&&this._onFinishChange.call(this,this.getValue())),this._changed=!1}reset(){return this.setValue(this.initialValue),this._callOnFinishChange(),this}enable(e=!0){return this.disable(!e)}disable(e=!0){return e===this._disabled?this:(this._disabled=e,this.domElement.classList.toggle(`lil-disabled`,e),this.$disable.toggleAttribute(`disabled`,e),this)}show(e=!0){return this._hidden=!e,this.domElement.style.display=this._hidden?`none`:``,this}hide(){return this.show(!1)}options(e){let t=this.parent.add(this.object,this.property,e);return t.name(this._name),this.destroy(),t}min(e){return this}max(e){return this}step(e){return this}decimals(e){return this}listen(e=!0){return this._listening=e,this._listenCallbackID!==void 0&&(cancelAnimationFrame(this._listenCallbackID),this._listenCallbackID=void 0),this._listening&&this._listenCallback(),this}_listenCallback(){this._listenCallbackID=requestAnimationFrame(this._listenCallback);let e=this.save();e!==this._listenPrevValue&&this.updateDisplay(),this._listenPrevValue=e}getValue(){return this.object[this.property]}setValue(e){return this.getValue()!==e&&(this.object[this.property]=e,this._callOnChange(),this.updateDisplay()),this}updateDisplay(){return this}load(e){return this.setValue(e),this._callOnFinishChange(),this}save(){return this.getValue()}destroy(){this.listen(!1),this.parent.children.splice(this.parent.children.indexOf(this),1),this.parent.controllers.splice(this.parent.controllers.indexOf(this),1),this.parent.$children.removeChild(this.domElement)}},r=class extends n{constructor(e,t,n){super(e,t,n,`lil-boolean`,`label`),this.$input=document.createElement(`input`),this.$input.setAttribute(`type`,`checkbox`),this.$input.setAttribute(`aria-labelledby`,this.$name.id),this.$widget.appendChild(this.$input),this.$input.addEventListener(`change`,()=>{this.setValue(this.$input.checked),this._callOnFinishChange()}),this.$disable=this.$input,this.updateDisplay()}updateDisplay(){return this.$input.checked=this.getValue(),this}};function i(e){let t,n;return(t=e.match(/(#|0x)?([a-f0-9]{6})/i))?n=t[2]:(t=e.match(/rgb\(\s*(\d*)\s*,\s*(\d*)\s*,\s*(\d*)\s*\)/))?n=parseInt(t[1]).toString(16).padStart(2,0)+parseInt(t[2]).toString(16).padStart(2,0)+parseInt(t[3]).toString(16).padStart(2,0):(t=e.match(/^#?([a-f0-9])([a-f0-9])([a-f0-9])$/i))&&(n=t[1]+t[1]+t[2]+t[2]+t[3]+t[3]),n?`#`+n:!1}var a={isPrimitive:!0,match:e=>typeof e==`string`,fromHexString:i,toHexString:i},o={isPrimitive:!0,match:e=>typeof e==`number`,fromHexString:e=>parseInt(e.substring(1),16),toHexString:e=>`#`+e.toString(16).padStart(6,0)},s=[a,o,{isPrimitive:!1,match:e=>Array.isArray(e)||ArrayBuffer.isView(e),fromHexString(e,t,n=1){let r=o.fromHexString(e);t[0]=(r>>16&255)/255*n,t[1]=(r>>8&255)/255*n,t[2]=(r&255)/255*n},toHexString([e,t,n],r=1){r=255/r;let i=e*r<<16^t*r<<8^n*r<<0;return o.toHexString(i)}},{isPrimitive:!1,match:e=>Object(e)===e,fromHexString(e,t,n=1){let r=o.fromHexString(e);t.r=(r>>16&255)/255*n,t.g=(r>>8&255)/255*n,t.b=(r&255)/255*n},toHexString({r:e,g:t,b:n},r=1){r=255/r;let i=e*r<<16^t*r<<8^n*r<<0;return o.toHexString(i)}}];function c(e){return s.find(t=>t.match(e))}var l=class extends n{constructor(e,t,n,r){super(e,t,n,`lil-color`),this.$input=document.createElement(`input`),this.$input.setAttribute(`type`,`color`),this.$input.setAttribute(`tabindex`,-1),this.$input.setAttribute(`aria-labelledby`,this.$name.id),this.$text=document.createElement(`input`),this.$text.setAttribute(`type`,`text`),this.$text.setAttribute(`spellcheck`,`false`),this.$text.setAttribute(`aria-labelledby`,this.$name.id),this.$display=document.createElement(`div`),this.$display.classList.add(`lil-display`),this.$display.appendChild(this.$input),this.$widget.appendChild(this.$display),this.$widget.appendChild(this.$text),this._format=c(this.initialValue),this._rgbScale=r,this._initialValueHexString=this.save(),this._textFocused=!1,this.$input.addEventListener(`input`,()=>{this._setValueFromHexString(this.$input.value)}),this.$input.addEventListener(`blur`,()=>{this._callOnFinishChange()}),this.$text.addEventListener(`input`,()=>{let e=i(this.$text.value);e&&this._setValueFromHexString(e)}),this.$text.addEventListener(`focus`,()=>{this._textFocused=!0,this.$text.select()}),this.$text.addEventListener(`blur`,()=>{this._textFocused=!1,this.updateDisplay(),this._callOnFinishChange()}),this.$disable=this.$text,this.updateDisplay()}reset(){return this._setValueFromHexString(this._initialValueHexString),this}_setValueFromHexString(e){if(this._format.isPrimitive){let t=this._format.fromHexString(e);this.setValue(t)}else this._format.fromHexString(e,this.getValue(),this._rgbScale),this._callOnChange(),this.updateDisplay()}save(){return this._format.toHexString(this.getValue(),this._rgbScale)}load(e){return this._setValueFromHexString(e),this._callOnFinishChange(),this}updateDisplay(){return this.$input.value=this._format.toHexString(this.getValue(),this._rgbScale),this._textFocused||(this.$text.value=this.$input.value.substring(1)),this.$display.style.backgroundColor=this.$input.value,this}},u=class extends n{constructor(e,t,n){super(e,t,n,`lil-function`),this.$button=document.createElement(`button`),this.$button.appendChild(this.$name),this.$widget.appendChild(this.$button),this.$button.addEventListener(`click`,e=>{e.preventDefault(),this.getValue().call(this.object),this._callOnChange()}),this.$button.addEventListener(`touchstart`,()=>{},{passive:!0}),this.$disable=this.$button}},d=class extends n{constructor(e,t,n,r,i,a){super(e,t,n,`lil-number`),this._initInput(),this.min(r),this.max(i);let o=a!==void 0;this.step(o?a:this._getImplicitStep(),o),this.updateDisplay()}decimals(e){return this._decimals=e,this.updateDisplay(),this}min(e){return this._min=e,this._onUpdateMinMax(),this}max(e){return this._max=e,this._onUpdateMinMax(),this}step(e,t=!0){return this._step=e,this._stepExplicit=t,this}updateDisplay(){let e=this.getValue();if(this._hasSlider){let t=(e-this._min)/(this._max-this._min);t=Math.max(0,Math.min(t,1)),this.$fill.style.width=t*100+`%`}return this._inputFocused||(this.$input.value=this._decimals===void 0?e:e.toFixed(this._decimals)),this}_initInput(){this.$input=document.createElement(`input`),this.$input.setAttribute(`type`,`text`),this.$input.setAttribute(`aria-labelledby`,this.$name.id),window.matchMedia(`(pointer: coarse)`).matches&&(this.$input.setAttribute(`type`,`number`),this.$input.setAttribute(`step`,`any`)),this.$widget.appendChild(this.$input),this.$disable=this.$input;let e=()=>{let e=parseFloat(this.$input.value);isNaN(e)||(this._stepExplicit&&(e=this._snap(e)),this.setValue(this._clamp(e)))},t=e=>{let t=parseFloat(this.$input.value);isNaN(t)||(this._snapClampSetValue(t+e),this.$input.value=this.getValue())},n=e=>{e.key===`Enter`&&this.$input.blur(),e.code===`ArrowUp`&&(e.preventDefault(),t(this._step*this._arrowKeyMultiplier(e))),e.code===`ArrowDown`&&(e.preventDefault(),t(this._step*this._arrowKeyMultiplier(e)*-1))},r=e=>{this._inputFocused&&(e.preventDefault(),t(this._step*this._normalizeMouseWheel(e)))},i=!1,a,o,s,c,l,u=e=>{a=e.clientX,o=s=e.clientY,i=!0,c=this.getValue(),l=0,window.addEventListener(`mousemove`,d),window.addEventListener(`mouseup`,f)},d=e=>{if(i){let t=e.clientX-a,n=e.clientY-o;Math.abs(n)>5?(e.preventDefault(),this.$input.blur(),i=!1,this._setDraggingStyle(!0,`vertical`)):Math.abs(t)>5&&f()}if(!i){let t=e.clientY-s;l-=t*this._step*this._arrowKeyMultiplier(e),c+l>this._max?l=this._max-c:c+l<this._min&&(l=this._min-c),this._snapClampSetValue(c+l)}s=e.clientY},f=()=>{this._setDraggingStyle(!1,`vertical`),this._callOnFinishChange(),window.removeEventListener(`mousemove`,d),window.removeEventListener(`mouseup`,f)};this.$input.addEventListener(`input`,e),this.$input.addEventListener(`keydown`,n),this.$input.addEventListener(`wheel`,r,{passive:!1}),this.$input.addEventListener(`mousedown`,u),this.$input.addEventListener(`focus`,()=>{this._inputFocused=!0}),this.$input.addEventListener(`blur`,()=>{this._inputFocused=!1,this.updateDisplay(),this._callOnFinishChange()})}_initSlider(){this._hasSlider=!0,this.$slider=document.createElement(`div`),this.$slider.classList.add(`lil-slider`),this.$fill=document.createElement(`div`),this.$fill.classList.add(`lil-fill`),this.$slider.appendChild(this.$fill),this.$widget.insertBefore(this.$slider,this.$input),this.domElement.classList.add(`lil-has-slider`);let e=(e,t,n,r,i)=>(e-t)/(n-t)*(i-r)+r,t=t=>{let n=this.$slider.getBoundingClientRect(),r=e(t,n.left,n.right,this._min,this._max);this._snapClampSetValue(r)},n=e=>{this._setDraggingStyle(!0),t(e.clientX),window.addEventListener(`mousemove`,r),window.addEventListener(`mouseup`,i)},r=e=>{t(e.clientX)},i=()=>{this._callOnFinishChange(),this._setDraggingStyle(!1),window.removeEventListener(`mousemove`,r),window.removeEventListener(`mouseup`,i)},a=!1,o,s,c=e=>{e.preventDefault(),this._setDraggingStyle(!0),t(e.touches[0].clientX),a=!1},l=e=>{e.touches.length>1||(this._hasScrollBar?(o=e.touches[0].clientX,s=e.touches[0].clientY,a=!0):c(e),window.addEventListener(`touchmove`,u,{passive:!1}),window.addEventListener(`touchend`,d))},u=e=>{if(a){let t=e.touches[0].clientX-o,n=e.touches[0].clientY-s;Math.abs(t)>Math.abs(n)?c(e):(window.removeEventListener(`touchmove`,u),window.removeEventListener(`touchend`,d))}else e.preventDefault(),t(e.touches[0].clientX)},d=()=>{this._callOnFinishChange(),this._setDraggingStyle(!1),window.removeEventListener(`touchmove`,u),window.removeEventListener(`touchend`,d)},f=this._callOnFinishChange.bind(this),p;this.$slider.addEventListener(`mousedown`,n),this.$slider.addEventListener(`touchstart`,l,{passive:!1}),this.$slider.addEventListener(`wheel`,e=>{if(Math.abs(e.deltaX)<Math.abs(e.deltaY)&&this._hasScrollBar)return;e.preventDefault();let t=this._normalizeMouseWheel(e)*this._step;this._snapClampSetValue(this.getValue()+t),this.$input.value=this.getValue(),clearTimeout(p),p=setTimeout(f,400)},{passive:!1})}_setDraggingStyle(e,t=`horizontal`){this.$slider&&this.$slider.classList.toggle(`lil-active`,e),document.body.classList.toggle(`lil-dragging`,e),document.body.classList.toggle(`lil-${t}`,e)}_getImplicitStep(){return this._hasMin&&this._hasMax?(this._max-this._min)/1e3:.1}_onUpdateMinMax(){!this._hasSlider&&this._hasMin&&this._hasMax&&(this._stepExplicit||this.step(this._getImplicitStep(),!1),this._initSlider(),this.updateDisplay())}_normalizeMouseWheel(e){let{deltaX:t,deltaY:n}=e;return Math.floor(e.deltaY)!==e.deltaY&&e.wheelDelta&&(t=0,n=-e.wheelDelta/120,n*=this._stepExplicit?1:10),t+-n}_arrowKeyMultiplier(e){let t=this._stepExplicit?1:10;return e.shiftKey?t*=10:e.altKey&&(t/=10),t}_snap(e){let t=0;return this._hasMin?t=this._min:this._hasMax&&(t=this._max),e-=t,e=Math.round(e/this._step)*this._step,e+=t,e=parseFloat(e.toPrecision(15)),e}_clamp(e){return e<this._min&&(e=this._min),e>this._max&&(e=this._max),e}_snapClampSetValue(e){this.setValue(this._clamp(this._snap(e)))}get _hasScrollBar(){let e=this.parent.root.$children;return e.scrollHeight>e.clientHeight}get _hasMin(){return this._min!==void 0}get _hasMax(){return this._max!==void 0}},f=class extends n{constructor(e,t,n,r){super(e,t,n,`lil-option`),this.$select=document.createElement(`select`),this.$select.setAttribute(`aria-labelledby`,this.$name.id),this.$display=document.createElement(`div`),this.$display.classList.add(`lil-display`),this.$select.addEventListener(`change`,()=>{this.setValue(this._values[this.$select.selectedIndex]),this._callOnFinishChange()}),this.$select.addEventListener(`focus`,()=>{this.$display.classList.add(`lil-focus`)}),this.$select.addEventListener(`blur`,()=>{this.$display.classList.remove(`lil-focus`)}),this.$widget.appendChild(this.$select),this.$widget.appendChild(this.$display),this.$disable=this.$select,this.options(r)}options(e){return this._values=Array.isArray(e)?e:Object.values(e),this._names=Array.isArray(e)?e:Object.keys(e),this.$select.replaceChildren(),this._names.forEach(e=>{let t=document.createElement(`option`);t.textContent=e,this.$select.appendChild(t)}),this.updateDisplay(),this}updateDisplay(){let e=this.getValue(),t=this._values.indexOf(e);return this.$select.selectedIndex=t,this.$display.textContent=t===-1?e:this._names[t],this}},p=class extends n{constructor(e,t,n){super(e,t,n,`lil-string`),this.$input=document.createElement(`input`),this.$input.setAttribute(`type`,`text`),this.$input.setAttribute(`spellcheck`,`false`),this.$input.setAttribute(`aria-labelledby`,this.$name.id),this.$input.addEventListener(`input`,()=>{this.setValue(this.$input.value)}),this.$input.addEventListener(`keydown`,e=>{e.code===`Enter`&&this.$input.blur()}),this.$input.addEventListener(`blur`,()=>{this._callOnFinishChange()}),this.$widget.appendChild(this.$input),this.$disable=this.$input,this.updateDisplay()}updateDisplay(){return this.$input.value=this.getValue(),this}},ee=`.lil-gui {
  font-family: var(--font-family);
  font-size: var(--font-size);
  line-height: 1;
  font-weight: normal;
  font-style: normal;
  text-align: left;
  color: var(--text-color);
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  --background-color: #1f1f1f;
  --text-color: #ebebeb;
  --title-background-color: #111111;
  --title-text-color: #ebebeb;
  --widget-color: #424242;
  --hover-color: #4f4f4f;
  --focus-color: #595959;
  --number-color: #2cc9ff;
  --string-color: #a2db3c;
  --font-size: 11px;
  --input-font-size: 11px;
  --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  --font-family-mono: Menlo, Monaco, Consolas, "Droid Sans Mono", monospace;
  --padding: 4px;
  --spacing: 4px;
  --widget-height: 20px;
  --title-height: calc(var(--widget-height) + var(--spacing) * 1.25);
  --name-width: 45%;
  --slider-knob-width: 2px;
  --slider-input-width: 27%;
  --color-input-width: 27%;
  --slider-input-min-width: 45px;
  --color-input-min-width: 45px;
  --folder-indent: 7px;
  --widget-padding: 0 0 0 3px;
  --widget-border-radius: 2px;
  --checkbox-size: calc(0.75 * var(--widget-height));
  --scrollbar-width: 5px;
}
.lil-gui, .lil-gui * {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
.lil-gui.lil-root {
  width: var(--width, 245px);
  display: flex;
  flex-direction: column;
  background: var(--background-color);
}
.lil-gui.lil-root > .lil-title {
  background: var(--title-background-color);
  color: var(--title-text-color);
}
.lil-gui.lil-root > .lil-children {
  overflow-x: hidden;
  overflow-y: auto;
}
.lil-gui.lil-root > .lil-children::-webkit-scrollbar {
  width: var(--scrollbar-width);
  height: var(--scrollbar-width);
  background: var(--background-color);
}
.lil-gui.lil-root > .lil-children::-webkit-scrollbar-thumb {
  border-radius: var(--scrollbar-width);
  background: var(--focus-color);
}
@media (pointer: coarse) {
  .lil-gui.lil-allow-touch-styles, .lil-gui.lil-allow-touch-styles .lil-gui {
    --widget-height: 28px;
    --padding: 6px;
    --spacing: 6px;
    --font-size: 13px;
    --input-font-size: 16px;
    --folder-indent: 10px;
    --scrollbar-width: 7px;
    --slider-input-min-width: 50px;
    --color-input-min-width: 65px;
  }
}
.lil-gui.lil-force-touch-styles, .lil-gui.lil-force-touch-styles .lil-gui {
  --widget-height: 28px;
  --padding: 6px;
  --spacing: 6px;
  --font-size: 13px;
  --input-font-size: 16px;
  --folder-indent: 10px;
  --scrollbar-width: 7px;
  --slider-input-min-width: 50px;
  --color-input-min-width: 65px;
}
.lil-gui.lil-auto-place, .lil-gui.autoPlace {
  max-height: 100%;
  position: fixed;
  top: 0;
  right: 15px;
  z-index: 1001;
}

.lil-controller {
  display: flex;
  align-items: center;
  padding: 0 var(--padding);
  margin: var(--spacing) 0;
}
.lil-controller.lil-disabled {
  opacity: 0.5;
}
.lil-controller.lil-disabled, .lil-controller.lil-disabled * {
  pointer-events: none !important;
}
.lil-controller > .lil-name {
  min-width: var(--name-width);
  flex-shrink: 0;
  white-space: pre;
  padding-right: var(--spacing);
  line-height: var(--widget-height);
}
.lil-controller .lil-widget {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  min-height: var(--widget-height);
}
.lil-controller.lil-string input {
  color: var(--string-color);
}
.lil-controller.lil-boolean {
  cursor: pointer;
}
.lil-controller.lil-color .lil-display {
  width: 100%;
  height: var(--widget-height);
  border-radius: var(--widget-border-radius);
  position: relative;
}
@media (hover: hover) {
  .lil-controller.lil-color .lil-display:hover:before {
    content: " ";
    display: block;
    position: absolute;
    border-radius: var(--widget-border-radius);
    border: 1px solid #fff9;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }
}
.lil-controller.lil-color input[type=color] {
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}
.lil-controller.lil-color input[type=text] {
  margin-left: var(--spacing);
  font-family: var(--font-family-mono);
  min-width: var(--color-input-min-width);
  width: var(--color-input-width);
  flex-shrink: 0;
}
.lil-controller.lil-option select {
  opacity: 0;
  position: absolute;
  width: 100%;
  max-width: 100%;
}
.lil-controller.lil-option .lil-display {
  position: relative;
  pointer-events: none;
  border-radius: var(--widget-border-radius);
  height: var(--widget-height);
  line-height: var(--widget-height);
  max-width: 100%;
  overflow: hidden;
  word-break: break-all;
  padding-left: 0.55em;
  padding-right: 1.75em;
  background: var(--widget-color);
}
@media (hover: hover) {
  .lil-controller.lil-option .lil-display.lil-focus {
    background: var(--focus-color);
  }
}
.lil-controller.lil-option .lil-display.lil-active {
  background: var(--focus-color);
}
.lil-controller.lil-option .lil-display:after {
  font-family: "lil-gui";
  content: "↕";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  padding-right: 0.375em;
}
.lil-controller.lil-option .lil-widget,
.lil-controller.lil-option select {
  cursor: pointer;
}
@media (hover: hover) {
  .lil-controller.lil-option .lil-widget:hover .lil-display {
    background: var(--hover-color);
  }
}
.lil-controller.lil-number input {
  color: var(--number-color);
}
.lil-controller.lil-number.lil-has-slider input {
  margin-left: var(--spacing);
  width: var(--slider-input-width);
  min-width: var(--slider-input-min-width);
  flex-shrink: 0;
}
.lil-controller.lil-number .lil-slider {
  width: 100%;
  height: var(--widget-height);
  background: var(--widget-color);
  border-radius: var(--widget-border-radius);
  padding-right: var(--slider-knob-width);
  overflow: hidden;
  cursor: ew-resize;
  touch-action: pan-y;
}
@media (hover: hover) {
  .lil-controller.lil-number .lil-slider:hover {
    background: var(--hover-color);
  }
}
.lil-controller.lil-number .lil-slider.lil-active {
  background: var(--focus-color);
}
.lil-controller.lil-number .lil-slider.lil-active .lil-fill {
  opacity: 0.95;
}
.lil-controller.lil-number .lil-fill {
  height: 100%;
  border-right: var(--slider-knob-width) solid var(--number-color);
  box-sizing: content-box;
}

.lil-dragging .lil-gui {
  --hover-color: var(--widget-color);
}
.lil-dragging * {
  cursor: ew-resize !important;
}
.lil-dragging.lil-vertical * {
  cursor: ns-resize !important;
}

.lil-gui .lil-title {
  height: var(--title-height);
  font-weight: 600;
  padding: 0 var(--padding);
  width: 100%;
  text-align: left;
  background: none;
  text-decoration-skip: objects;
}
.lil-gui .lil-title:before {
  font-family: "lil-gui";
  content: "▾";
  padding-right: 2px;
  display: inline-block;
}
.lil-gui .lil-title:active {
  background: var(--title-background-color);
  opacity: 0.75;
}
@media (hover: hover) {
  body:not(.lil-dragging) .lil-gui .lil-title:hover {
    background: var(--title-background-color);
    opacity: 0.85;
  }
  .lil-gui .lil-title:focus {
    text-decoration: underline var(--focus-color);
  }
}
.lil-gui.lil-root > .lil-title:focus {
  text-decoration: none !important;
}
.lil-gui.lil-closed > .lil-title:before {
  content: "▸";
}
.lil-gui.lil-closed > .lil-children {
  transform: translateY(-7px);
  opacity: 0;
}
.lil-gui.lil-closed:not(.lil-transition) > .lil-children {
  display: none;
}
.lil-gui.lil-transition > .lil-children {
  transition-duration: 300ms;
  transition-property: height, opacity, transform;
  transition-timing-function: cubic-bezier(0.2, 0.6, 0.35, 1);
  overflow: hidden;
  pointer-events: none;
}
.lil-gui .lil-children:empty:before {
  content: "Empty";
  padding: 0 var(--padding);
  margin: var(--spacing) 0;
  display: block;
  height: var(--widget-height);
  font-style: italic;
  line-height: var(--widget-height);
  opacity: 0.5;
}
.lil-gui.lil-root > .lil-children > .lil-gui > .lil-title {
  border: 0 solid var(--widget-color);
  border-width: 1px 0;
  transition: border-color 300ms;
}
.lil-gui.lil-root > .lil-children > .lil-gui.lil-closed > .lil-title {
  border-bottom-color: transparent;
}
.lil-gui + .lil-controller {
  border-top: 1px solid var(--widget-color);
  margin-top: 0;
  padding-top: var(--spacing);
}
.lil-gui .lil-gui .lil-gui > .lil-title {
  border: none;
}
.lil-gui .lil-gui .lil-gui > .lil-children {
  border: none;
  margin-left: var(--folder-indent);
  border-left: 2px solid var(--widget-color);
}
.lil-gui .lil-gui .lil-controller {
  border: none;
}

.lil-gui label, .lil-gui input, .lil-gui button {
  -webkit-tap-highlight-color: transparent;
}
.lil-gui input {
  border: 0;
  outline: none;
  font-family: var(--font-family);
  font-size: var(--input-font-size);
  border-radius: var(--widget-border-radius);
  height: var(--widget-height);
  background: var(--widget-color);
  color: var(--text-color);
  width: 100%;
}
@media (hover: hover) {
  .lil-gui input:hover {
    background: var(--hover-color);
  }
  .lil-gui input:active {
    background: var(--focus-color);
  }
}
.lil-gui input:disabled {
  opacity: 1;
}
.lil-gui input[type=text],
.lil-gui input[type=number] {
  padding: var(--widget-padding);
  -moz-appearance: textfield;
}
.lil-gui input[type=text]:focus,
.lil-gui input[type=number]:focus {
  background: var(--focus-color);
}
.lil-gui input[type=checkbox] {
  appearance: none;
  width: var(--checkbox-size);
  height: var(--checkbox-size);
  border-radius: var(--widget-border-radius);
  text-align: center;
  cursor: pointer;
}
.lil-gui input[type=checkbox]:checked:before {
  font-family: "lil-gui";
  content: "✓";
  font-size: var(--checkbox-size);
  line-height: var(--checkbox-size);
}
@media (hover: hover) {
  .lil-gui input[type=checkbox]:focus {
    box-shadow: inset 0 0 0 1px var(--focus-color);
  }
}
.lil-gui button {
  outline: none;
  cursor: pointer;
  font-family: var(--font-family);
  font-size: var(--font-size);
  color: var(--text-color);
  width: 100%;
  border: none;
}
.lil-gui .lil-controller button {
  height: var(--widget-height);
  text-transform: none;
  background: var(--widget-color);
  border-radius: var(--widget-border-radius);
}
@media (hover: hover) {
  .lil-gui .lil-controller button:hover {
    background: var(--hover-color);
  }
  .lil-gui .lil-controller button:focus {
    box-shadow: inset 0 0 0 1px var(--focus-color);
  }
}
.lil-gui .lil-controller button:active {
  background: var(--focus-color);
}

@font-face {
  font-family: "lil-gui";
  src: url("data:application/font-woff2;charset=utf-8;base64,d09GMgABAAAAAALkAAsAAAAABtQAAAKVAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHFQGYACDMgqBBIEbATYCJAMUCwwABCAFhAoHgQQbHAbIDiUFEYVARAAAYQTVWNmz9MxhEgodq49wYRUFKE8GWNiUBxI2LBRaVnc51U83Gmhs0Q7JXWMiz5eteLwrKwuxHO8VFxUX9UpZBs6pa5ABRwHA+t3UxUnH20EvVknRerzQgX6xC/GH6ZUvTcAjAv122dF28OTqCXrPuyaDER30YBA1xnkVutDDo4oCi71Ca7rrV9xS8dZHbPHefsuwIyCpmT7j+MnjAH5X3984UZoFFuJ0yiZ4XEJFxjagEBeqs+e1iyK8Xf/nOuwF+vVK0ur765+vf7txotUi0m3N0m/84RGSrBCNrh8Ee5GjODjF4gnWP+dJrH/Lk9k4oT6d+gr6g/wssA2j64JJGP6cmx554vUZnpZfn6ZfX2bMwPPrlANsB86/DiHjhl0OP+c87+gaJo/gY084s3HoYL/ZkWHTRfBXvvoHnnkHvngKun4KBE/ede7tvq3/vQOxDXB1/fdNz6XbPdcr0Vhpojj9dG+owuSKFsslCi1tgEjirjXdwMiov2EioadxmqTHUCIwo8NgQaeIasAi0fTYSPTbSmwbMOFduyh9wvBrESGY0MtgRjtgQR8Q1bRPohn2UoCRZf9wyYANMXFeJTysqAe0I4mrherOekFdKMrYvJjLvOIUM9SuwYB5DVZUwwVjJJOaUnZCmcEkIZZrKqNvRGRMvmFZsmhP4VMKCSXBhSqUBxgMS7h0cZvEd71AWkEhGWaeMFcNnpqyJkyXgYL7PQ1MoSq0wDAkRtJIijkZSmqYTiSImfLiSWXIZwhRh3Rug2X0kk1Dgj+Iu43u5p98ghopcpSo0Uyc8SnjlYX59WUeaMoDqmVD2TOWD9a4pCRAzf2ECgwGcrHjPOWY9bNxq/OL3I/QjwEAAAA=") format("woff2");
}`;function te(e){let t=document.createElement(`style`);t.innerHTML=e;let n=document.querySelector(`head link[rel=stylesheet], head style`);n?document.head.insertBefore(t,n):document.head.appendChild(t)}var m=!1,ne=class e{constructor({parent:e,autoPlace:t=e===void 0,container:n,width:r,title:i=`Controls`,closeFolders:a=!1,injectStyles:o=!0,touchStyles:s=!0}={}){if(this.parent=e,this.root=e?e.root:this,this.children=[],this.controllers=[],this.folders=[],this._closed=!1,this._hidden=!1,this.domElement=document.createElement(`div`),this.domElement.classList.add(`lil-gui`),this.$title=document.createElement(`button`),this.$title.classList.add(`lil-title`),this.$title.setAttribute(`aria-expanded`,!0),this.$title.addEventListener(`click`,()=>this.openAnimated(this._closed)),this.$title.addEventListener(`touchstart`,()=>{},{passive:!0}),this.$children=document.createElement(`div`),this.$children.classList.add(`lil-children`),this.domElement.appendChild(this.$title),this.domElement.appendChild(this.$children),this.title(i),this.parent){this.parent.children.push(this),this.parent.folders.push(this),this.parent.$children.appendChild(this.domElement);return}this.domElement.classList.add(`lil-root`),s&&this.domElement.classList.add(`lil-allow-touch-styles`),!m&&o&&(te(ee),m=!0),n?n.appendChild(this.domElement):t&&(this.domElement.classList.add(`lil-auto-place`,`autoPlace`),document.body.appendChild(this.domElement)),r&&this.domElement.style.setProperty(`--width`,r+`px`),this._closeFolders=a}add(e,t,n,i,a){if(Object(n)===n)return new f(this,e,t,n);let o=e[t];switch(typeof o){case`number`:return new d(this,e,t,n,i,a);case`boolean`:return new r(this,e,t);case`string`:return new p(this,e,t);case`function`:return new u(this,e,t)}console.error(`gui.add failed
	property:`,t,`
	object:`,e,`
	value:`,o)}addColor(e,t,n=1){return new l(this,e,t,n)}addFolder(t){let n=new e({parent:this,title:t});return this.root._closeFolders&&n.close(),n}load(e,t=!0){return e.controllers&&this.controllers.forEach(t=>{t instanceof u||t._name in e.controllers&&t.load(e.controllers[t._name])}),t&&e.folders&&this.folders.forEach(t=>{t._title in e.folders&&t.load(e.folders[t._title])}),this}save(e=!0){let t={controllers:{},folders:{}};return this.controllers.forEach(e=>{if(!(e instanceof u)){if(e._name in t.controllers)throw Error(`Cannot save GUI with duplicate property "${e._name}"`);t.controllers[e._name]=e.save()}}),e&&this.folders.forEach(e=>{if(e._title in t.folders)throw Error(`Cannot save GUI with duplicate folder "${e._title}"`);t.folders[e._title]=e.save()}),t}open(e=!0){return this._setClosed(!e),this.$title.setAttribute(`aria-expanded`,!this._closed),this.domElement.classList.toggle(`lil-closed`,this._closed),this}close(){return this.open(!1)}_setClosed(e){this._closed!==e&&(this._closed=e,this._callOnOpenClose(this))}show(e=!0){return this._hidden=!e,this.domElement.style.display=this._hidden?`none`:``,this}hide(){return this.show(!1)}openAnimated(e=!0){return this._setClosed(!e),this.$title.setAttribute(`aria-expanded`,!this._closed),requestAnimationFrame(()=>{let t=this.$children.clientHeight;this.$children.style.height=t+`px`,this.domElement.classList.add(`lil-transition`);let n=e=>{e.target===this.$children&&(this.$children.style.height=``,this.domElement.classList.remove(`lil-transition`),this.$children.removeEventListener(`transitionend`,n))};this.$children.addEventListener(`transitionend`,n);let r=e?this.$children.scrollHeight:0;this.domElement.classList.toggle(`lil-closed`,!e),requestAnimationFrame(()=>{this.$children.style.height=r+`px`})}),this}title(e){return this._title=e,this.$title.textContent=e,this}reset(e=!0){return(e?this.controllersRecursive():this.controllers).forEach(e=>e.reset()),this}onChange(e){return this._onChange=e,this}_callOnChange(e){this.parent&&this.parent._callOnChange(e),this._onChange!==void 0&&this._onChange.call(this,{object:e.object,property:e.property,value:e.getValue(),controller:e})}onFinishChange(e){return this._onFinishChange=e,this}_callOnFinishChange(e){this.parent&&this.parent._callOnFinishChange(e),this._onFinishChange!==void 0&&this._onFinishChange.call(this,{object:e.object,property:e.property,value:e.getValue(),controller:e})}onOpenClose(e){return this._onOpenClose=e,this}_callOnOpenClose(e){this.parent&&this.parent._callOnOpenClose(e),this._onOpenClose!==void 0&&this._onOpenClose.call(this,e)}destroy(){this.parent&&(this.parent.children.splice(this.parent.children.indexOf(this),1),this.parent.folders.splice(this.parent.folders.indexOf(this),1)),this.domElement.parentElement&&this.domElement.parentElement.removeChild(this.domElement),Array.from(this.children).forEach(e=>e.destroy())}controllersRecursive(){let e=Array.from(this.controllers);return this.folders.forEach(t=>{e=e.concat(t.controllersRecursive())}),e}foldersRecursive(){let e=Array.from(this.folders);return this.folders.forEach(t=>{e=e.concat(t.foldersRecursive())}),e}},re=`modulepreload`,ie=function(e,t){return new URL(e,t).href},h={},g=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}function s(e){return import.meta.resolve?import.meta.resolve(e):new URL(e,import.meta.url).href}r=o(t.map(t=>{if(t=ie(t,n),t=s(t),t in h)return;h[t]=!0;let r=t.endsWith(`.css`);for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}let i=document.createElement(`link`);if(i.rel=r?`stylesheet`:re,r||(i.as=`script`),i.crossOrigin=``,i.href=t,a&&i.setAttribute(`nonce`,a),document.head.appendChild(i),r)return new Promise((e,n)=>{i.addEventListener(`load`,e),i.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}).filter(e=>e!==void 0))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},_=[`union`,`intersection`,`diff`,`xor`,`diff_ba`],v=Object.assign({"../test/fixtures/asia.geojson":()=>g(()=>import(`./asia-BQ5urkYl.js`).then(e=>e.default),[],import.meta.url),"../test/fixtures/asia_unionPoly.geojson":()=>g(()=>import(`./asia_unionPoly-BqXLYrfM.js`).then(e=>e.default),[],import.meta.url),"../test/fixtures/canada.geojson":()=>g(()=>import(`./canada-B7JIcElB.js`).then(e=>e.default),[],import.meta.url),"../test/fixtures/collapsed.geojson":()=>g(()=>import(`./collapsed-Bt9GrDv8.js`).then(e=>e.default),[],import.meta.url),"../test/fixtures/crash_overlap.geojson":()=>g(()=>import(`./crash_overlap-DLoE4cHI.js`).then(e=>e.default),[],import.meta.url),"../test/fixtures/disjoint_boxes.geojson":()=>g(()=>import(`./disjoint_boxes-CMoPELvZ.js`).then(e=>e.default),[],import.meta.url),"../test/fixtures/hole_cut.geojson":()=>g(()=>import(`./hole_cut-Cyey7fJO.js`).then(e=>e.default),[],import.meta.url),"../test/fixtures/hole_hole.geojson":()=>g(()=>import(`./hole_hole-CgzCQJr8.js`).then(e=>e.default),[],import.meta.url),"../test/fixtures/horseshoe.geojson":()=>g(()=>import(`./horseshoe-D_QBhcB8.js`).then(e=>e.default),[],import.meta.url),"../test/fixtures/indonesia.geojson":()=>g(()=>import(`./indonesia-YQP43BRW.js`).then(e=>e.default),[],import.meta.url),"../test/fixtures/issue100.geojson":()=>g(()=>import(`./issue100-D0zcO0dz.js`).then(e=>e.default),[],import.meta.url),"../test/fixtures/issue102.geojson":()=>g(()=>import(`./issue102-CmpacG1b.js`).then(e=>e.default),[],import.meta.url),"../test/fixtures/issue110.geojson":()=>g(()=>import(`./issue110-CMMH60Xt.js`).then(e=>e.default),[],import.meta.url),"../test/fixtures/issue90.geojson":()=>g(()=>import(`./issue90-BsDMZzrg.js`).then(e=>e.default),[],import.meta.url),"../test/fixtures/issue99.geojson":()=>g(()=>import(`./issue99-BFs9jBbL.js`).then(e=>e.default),[],import.meta.url),"../test/fixtures/one_inside.geojson":()=>g(()=>import(`./one_inside-BgRkJdzv.js`).then(e=>e.default),[],import.meta.url),"../test/fixtures/overlap_loop_x10.geojson":()=>g(()=>import(`./overlap_loop_x10-Doq9dm9R.js`).then(e=>e.default),[],import.meta.url),"../test/fixtures/overlap_self_intersect.geojson":()=>g(()=>import(`./overlap_self_intersect-CurC2m_7.js`).then(e=>e.default),[],import.meta.url),"../test/fixtures/overlap_two.geojson":()=>g(()=>import(`./overlap_two-BtAMIonK.js`).then(e=>e.default),[],import.meta.url),"../test/fixtures/overlapping_segments.geojson":()=>g(()=>import(`./overlapping_segments-Gn0_Bfe1.js`).then(e=>e.default),[],import.meta.url),"../test/fixtures/overlapping_segments_complex.geojson":()=>g(()=>import(`./overlapping_segments_complex-oWt_JZJC.js`).then(e=>e.default),[],import.meta.url),"../test/fixtures/polygons_edge_overlap.geojson":()=>g(()=>import(`./polygons_edge_overlap-CiGpxcMN.js`).then(e=>e.default),[],import.meta.url),"../test/fixtures/saw_rect.geojson":()=>g(()=>import(`./saw_rect-B4JbmDH5.js`).then(e=>e.default),[],import.meta.url),"../test/fixtures/self_intersecting.geojson":()=>g(()=>import(`./self_intersecting-DibMAVLg.js`).then(e=>e.default),[],import.meta.url),"../test/fixtures/shape_border.geojson":()=>g(()=>import(`./shape_border-BWl6dnEF.js`).then(e=>e.default),[],import.meta.url),"../test/fixtures/states_source.geojson":()=>g(()=>import(`./states_source-DF4UHIJt.js`).then(e=>e.default),[],import.meta.url),"../test/fixtures/trapezoid-box.geojson":()=>g(()=>import(`./trapezoid-box-DQXcTFGS.js`).then(e=>e.default),[],import.meta.url),"../test/fixtures/two_pointed_triangles.geojson":()=>g(()=>import(`./two_pointed_triangles-DBJwVWt5.js`).then(e=>e.default),[],import.meta.url),"../test/fixtures/two_shapes.geojson":()=>g(()=>import(`./two_shapes-CKQ-0anr.js`).then(e=>e.default),[],import.meta.url),"../test/fixtures/two_triangles.geojson":()=>g(()=>import(`./two_triangles-DPb6Frh-.js`).then(e=>e.default),[],import.meta.url),"../test/fixtures/vertical_boxes.geojson":()=>g(()=>import(`./vertical_boxes-DHXiZGdO.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/basic1_poly.geojson":()=>g(()=>import(`./basic1_poly-Do0L-TVr.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/basic3_multi_poly.geojson":()=>g(()=>import(`./basic3_multi_poly-DoFusqH6.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/checkerboard1.geojson":()=>g(()=>import(`./checkerboard1-BKLUujdW.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/closed_loop1.geojson":()=>g(()=>import(`./closed_loop1-BXCZ6A2S.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/collapsed_edges_removed.geojson":()=>g(()=>import(`./collapsed_edges_removed-CQr79R-j.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/collinear_segments1.geojson":()=>g(()=>import(`./collinear_segments1-CK0CFboq.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/daef_polygonwithholes_holed.geojson":()=>g(()=>import(`./daef_polygonwithholes_holed-CrftPCLs.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/disjoint_boxes.geojson":()=>g(()=>import(`./disjoint_boxes-BZyiTdL1.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/disjoint_union_nesting.geojson":()=>g(()=>import(`./disjoint_union_nesting-DSxrorOH.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/fatal1.geojson":()=>g(()=>import(`./fatal1-f6AYbp-G.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/fatal2.geojson":()=>g(()=>import(`./fatal2-n9_CQZVR.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/fatal3.geojson":()=>g(()=>import(`./fatal3-D5YJPLA1.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/fatal4.geojson":()=>g(()=>import(`./fatal4-BqOR1EGc.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/filling_rectangle.geojson":()=>g(()=>import(`./filling_rectangle-CltXNZ_5.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/hourglasses.geojson":()=>g(()=>import(`./hourglasses-C78RsDPL.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/intersections_at_endpoints.geojson":()=>g(()=>import(`./intersections_at_endpoints-CI3TgzGZ.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/issue103.geojson":()=>g(()=>import(`./issue103-BdWfm0Dv.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/issue124.geojson":()=>g(()=>import(`./issue124-DmHR_aMO.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/issue155.geojson":()=>g(()=>import(`./issue155-DIlnu5Pq.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/issue171.geojson":()=>g(()=>import(`./issue171-C0wB723P.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/issue57.geojson":()=>g(()=>import(`./issue57-od2RiKnr.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/issue65.geojson":()=>g(()=>import(`./issue65-ChfHQ71G.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/issue68.geojson":()=>g(()=>import(`./issue68-58M04rpH.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/issue69.geojson":()=>g(()=>import(`./issue69-BOmx4Gmy.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/issue69_sub1.geojson":()=>g(()=>import(`./issue69_sub1-CARvo_BE.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/issue71.geojson":()=>g(()=>import(`./issue71-B_hHsAo1.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/issue76.geojson":()=>g(()=>import(`./issue76-CWnxz4Sm.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/issue80.geojson":()=>g(()=>import(`./issue80-B0sFl4Oc.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/issue93.geojson":()=>g(()=>import(`./issue93-DbEieJuK.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/issue96.geojson":()=>g(()=>import(`./issue96-6MCPBhb3.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/issue97.geojson":()=>g(()=>import(`./issue97-CvhUKTtY.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/issue98.geojson":()=>g(()=>import(`./issue98-Bknbg6UC.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/nested_polys1.geojson":()=>g(()=>import(`./nested_polys1-Kftwx0V1.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/nested_polys2.geojson":()=>g(()=>import(`./nested_polys2-Dw1Dejac.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/nested_polys3.geojson":()=>g(()=>import(`./nested_polys3-CTaPQDkp.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/overlap_loop.geojson":()=>g(()=>import(`./overlap_loop-84wapWg7.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/overlap_y.geojson":()=>g(()=>import(`./overlap_y-cuPKlh0s.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/overlapping_segments1.geojson":()=>g(()=>import(`./overlapping_segments1-CRsq2ue8.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/overlapping_segments2.geojson":()=>g(()=>import(`./overlapping_segments2-Bdaj0F0d.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/overlapping_segments3.geojson":()=>g(()=>import(`./overlapping_segments3-Cf048c8E.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/polygon_trapezoid_edge_overlap.geojson":()=>g(()=>import(`./polygon_trapezoid_edge_overlap-N-ekaHI3.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/tie.geojson":()=>g(()=>import(`./tie-BLh7aBNm.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/touching_boxes.geojson":()=>g(()=>import(`./touching_boxes-B8I7oPNl.js`).then(e=>e.default),[],import.meta.url),"../test/genericTestCases/vertical_boxes.geojson":()=>g(()=>import(`./vertical_boxes-DOaz59cG.js`).then(e=>e.default),[],import.meta.url)}),y={"fixtures/asia":`fixtures/asia_unionPoly`},ae=e=>e.replace(`../test/`,``).replace(`genericTestCases/`,`generic/`).replace(`.geojson`,``),b=new Map(Object.keys(v).map(e=>[ae(e),e])),x=`synthetic/asia shifted`,S=[...[...b.keys()].sort((e,t)=>e.startsWith(`generic/`)===t.startsWith(`generic/`)?e.localeCompare(t):e.startsWith(`generic/`)?-1:1),x],C=e=>e.type===`Polygon`?[e.coordinates]:e.coordinates;async function w(e){let t=JSON.parse(await v[b.get(e)]());return t.type===`FeatureCollection`?t.features:[t]}function oe(e){let[t,n,r,i]=j([e]),a=(r-t)/4,o=(i-n)/4;return[[[[t+a,n+o],[r-a,n+o],[r-a,i-o],[t+a,i-o],[t+a,n+o]]]]}var se=(e,t)=>e.map(e=>e.map(e=>e.map(([e,n])=>[e+t,n])));async function ce(e){if(e===x){let e=C((await w(`fixtures/asia`))[0].geometry);return{subject:e,clipping:se(e,B.shift),expected:{},note:`clipping: fixtures/asia shifted east (use the shift slider)`}}let t=(await w(e)).filter(e=>e.geometry),n={};for(let e of t.slice(2))e.properties?.operation&&(n[e.properties.operation]=e.geometry.coordinates);let r=C(t[0].geometry);return t.length>1?{subject:r,clipping:C(t[1].geometry),expected:n}:y[e]?{subject:r,clipping:C((await w(y[e]))[0].geometry),expected:n,note:`clipping: ${y[e]}`}:{subject:r,clipping:oe(r),expected:n,note:`clipping: central box of the bounds`}}function le(n,r){return r===`diff_ba`?t(n.clipping,n.subject):e[r](n.subject,n.clipping)}var T=document.getElementById(`view`),E=T.getContext(`2d`),ue=document.getElementById(`status`),D={scale:1,x:0,y:0},O=null,k=null,A=null;function j(e){let t=1/0,n=1/0,r=-1/0,i=-1/0;for(let a of e)if(a)for(let e of a)for(let a of e)for(let[e,o]of a)e<t&&(t=e),o<n&&(n=o),e>r&&(r=e),o>i&&(i=o);return[t,n,r,i]}function M(){if(!O)return;let[e,t,n,r]=j([O.subject,O.clipping]),i=J.domElement.offsetWidth+40,a=T.clientWidth-i,o=T.clientHeight;D.scale=Math.min((a-80)/(n-e||1),(o-80)/(r-t||1)),D.x=(e+n)/2-a/2/D.scale,D.y=(t+r)/2+o/2/D.scale,z()}var N=e=>[(e[0]-D.x)*D.scale,(D.y-e[1])*D.scale],P=(e,t)=>[e/D.scale+D.x,D.y-t/D.scale];function F(e){E.beginPath();for(let t of e)for(let e of t)e.forEach((e,t)=>{let[n,r]=N(e);t===0?E.moveTo(n,r):E.lineTo(n,r)}),E.closePath()}function I(e,t){e&&(F(e),E.fillStyle=t,E.fill(`evenodd`))}function L(e,t,n,r=[]){e&&(F(e),E.setLineDash(r),E.strokeStyle=t,E.lineWidth=n,E.stroke(),E.setLineDash([]))}function R(e,t){if(e){E.fillStyle=t;for(let t of e)for(let e of t)for(let t of e){let[e,n]=N(t);E.fillRect(e-2,n-2,4,4)}}}function z(){let e=window.devicePixelRatio||1,t=T.clientWidth,n=T.clientHeight;(T.width!==t*e||T.height!==n*e)&&(T.width=t*e,T.height=n*e),E.setTransform(e,0,0,e,0,0),E.clearRect(0,0,t,n),O&&(B.subject&&I(O.subject,`rgba(37, 99, 235, 0.12)`),B.clipping&&I(O.clipping,`rgba(220, 38, 38, 0.12)`),B.result&&I(k,`rgba(22, 163, 74, 0.35)`),B.result&&L(k,`#15803d`,2),B.subject&&L(O.subject,`#2563eb`,1),B.clipping&&L(O.clipping,`#dc2626`,1),B.expected&&L(O.expected[B.operation],`#7c3aed`,2,[6,4]),B.vertices&&(B.subject&&R(O.subject,`#2563eb`),B.clipping&&R(O.clipping,`#dc2626`),B.result&&R(k,`#15803d`)),U())}var B={case:S[0],operation:`union`,subject:!0,clipping:!0,result:!0,expected:!0,vertices:!1,shift:.05,fit:M,previous:()=>q(-1),next:()=>q(1),copyResult:()=>navigator.clipboard.writeText(JSON.stringify(k))},V={time:``,output:``,expected:``};function de(e){if(!e)return`null`;let t=0,n=0;for(let r of e)for(let e of r)t++,n+=e.length;return`${e.length} polygons, ${t} rings, ${n} vertices`}function H(){if(!O)return;let e=performance.now();try{k=le(O,B.operation),V.output=de(k)}catch(e){k=null,V.output=`threw: ${e.message}`}V.time=`${(performance.now()-e).toFixed(2)} ms`;let t=O.expected[B.operation];V.expected=t===void 0?`no expectation`:JSON.stringify(t)===JSON.stringify(k)?`✓ matches`:`✗ differs`,J.controllersRecursive().forEach(e=>e.updateDisplay());let n=`#${encodeURIComponent(B.case)}/${B.operation}`;location.hash!==n&&history.replaceState(null,``,n),z()}function U(){let e=[`${B.case}  ·  ${B.operation}`];O?.note&&e.push(O.note),e.push(`${V.time}  ·  ${V.output}  ·  ${V.expected}`),A&&e.push(`x ${A[0].toPrecision(10)}  y ${A[1].toPrecision(10)}`),ue.textContent=e.join(`
`)}var W=0;async function G(e,t=!1){let n=++W,r=await ce(e);if(n!==W)return;O=r;let i=Object.keys(r.expected);!t&&i.length&&!i.includes(B.operation)&&(B.operation=i[0]),pe.show(e===x),M(),H()}var K=0;function fe(){O&&B.case===x&&!K&&(K=requestAnimationFrame(()=>{K=0,O.clipping=se(O.subject,B.shift),H()}))}function q(e){B.case=S[(S.indexOf(B.case)+e+S.length)%S.length],G(B.case)}var J=new ne({title:`Martinez test cases`}),Y=()=>document.activeElement?.blur();J.add(B,`case`,S).name(`test case`).onChange(e=>{Y(),G(e)}),J.add(B,`operation`,_).onChange(()=>{Y(),H()});var pe=J.add(B,`shift`,0,2,.01).name(`shift (°)`).onChange(fe).hide(),X=J.addFolder(`Navigate`);X.add(B,`previous`).name(`← previous case`),X.add(B,`next`).name(`next case →`),X.add(B,`fit`).name(`fit view`);var me=J.addFolder(`Layers`);for(let e of[`subject`,`clipping`,`result`,`expected`,`vertices`])me.add(B,e).onChange(z);var Z=J.addFolder(`Result`);Z.add(V,`time`).disable(),Z.add(V,`output`).disable(),Z.add(V,`expected`).disable(),Z.add(B,`copyResult`).name(`copy result JSON`);var Q=null;T.addEventListener(`pointerdown`,e=>{Y(),Q={x:e.clientX,y:e.clientY},T.setPointerCapture(e.pointerId),T.classList.add(`dragging`)}),T.addEventListener(`pointermove`,e=>{A=P(e.offsetX,e.offsetY),Q?(D.x-=(e.clientX-Q.x)/D.scale,D.y+=(e.clientY-Q.y)/D.scale,Q={x:e.clientX,y:e.clientY},z()):U()}),T.addEventListener(`pointerup`,()=>{Q=null,T.classList.remove(`dragging`)}),T.addEventListener(`wheel`,e=>{e.preventDefault();let[t,n]=P(e.offsetX,e.offsetY);D.scale*=Math.exp(-e.deltaY*.002),D.x=t-e.offsetX/D.scale,D.y=n+e.offsetY/D.scale,z()},{passive:!1}),window.addEventListener(`keydown`,e=>{e.target instanceof Element&&e.target.closest(`.lil-gui`)||(e.key===`ArrowLeft`?q(-1):e.key===`ArrowRight`?q(1):e.key===`f`?M():e.key>=`1`&&e.key<=`5`&&(B.operation=_[Number(e.key)-1],H()))}),window.addEventListener(`resize`,z);function $(){let[e,t]=location.hash.slice(1).split(`/`).map(decodeURIComponent);e&&S.includes(e)&&(B.case=e),_.includes(t)&&(B.operation=t),G(B.case,!!t)}window.addEventListener(`hashchange`,$),$();