//
// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as Schism from  './rt/rt.js';

async function compileSchism() {
  const schism_bytes = await fetch('schism-stage0.wasm', { credentials: 'include' });
  const engine = new Schism.Engine;
  const schism = await engine.loadWasmModule(await schism_bytes.arrayBuffer());
  console.info('Loading Schism Complete');
  return { schism, engine };
}

const compiler = compileSchism();

export async function compileAndRun(src) {
  console.info(`Compiling program: '${src}'`);
  const { schism, engine } = await compiler;
  const compile = schism.exports['compile-stdin->stdout'];

  let new_src = [];
  for (let c of src) {
    new_src.push(c.charCodeAt(0));
  }

  engine.setCurrentInputPort(new_src);
  engine.output_data.length = 0;
  compile();

  console.info("Compilation complete, executing program");

  const bytes = new Uint8Array(engine.output_data);
  const import_object = {
    'rt': engine.rt,
    'memory': { 'memory': engine.memory }
  };
  const result = (await WebAssembly.instantiate(bytes, import_object));
  engine.setCurrentInputPort('');
  engine.output_data.length = 0;

  const scheme_result = engine.jsFromScheme(result.instance.exports.main());
  return "" + scheme_result;
}

const cm = window.CodeMirror.fromTextArea(document.getElementById("src"));

document.getElementById('go').addEventListener('click', () => {
  // const src = document.getElementById('src').value;
  const src = cm.getValue();
  compileAndRun(src).then(scheme_result => {
    document.getElementById('result').innerHTML = scheme_result;
  }).catch(e => {
    console.error(e)
    document.getElementById('result').innerHTML = e;
  });
});
