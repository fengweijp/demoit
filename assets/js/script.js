const CODEMIRROR_SETTINGS = {
  value: '',
  mode:  'jsx',
  tabSize: 2,
  lineNumbers: false,
  autofocus: true,
  foldGutter: false,
  gutters: []
};

// ********************************************************************************* EDITOR
const createEditor = function (settings, onChange) {
  const api = {
    demo: 0,
    frame: 0,
    async showFrame(demo, frame) {
      if (typeof demo !== 'undefined') this.demo = demo;
      if (typeof frame !== 'undefined') this.frame = frame;

      try {
        const res = await fetch(settings.demos[this.demo].frames[this.frame].path);
        const code = await res.text();

        editor.setValue(code);
      } catch (error) {
        console.error(error);
      }
    }
  }
  const container = el('.js-code-editor');
  const editor = CodeMirror(
    container,
    Object.assign({}, CODEMIRROR_SETTINGS, settings.editor)
  );

  editor.on('change', debounce(function () {
    onChange(settings.demos[api.demo].transform(editor.getValue()));
  }, settings.editor.changeDebounceTime));
  editor.setValue('');
  container.addEventListener('click', () => editor.focus());

  addStyleString(`
    .js-code-editor {
      font-size: ${ settings.editor.fontSize };
      line-height: ${ settings.editor.lineHeight };
    }
  `);

  return api;
};
const loadEditorTheme = async function(settings) {
  try {
    const res = await fetch(`./vendor/codemirror/theme/${ settings.editor.theme }.css`);
    const css = await res.text();

    addStyleString(css);
  } catch (error) {
    console.log(error);
  }
}

// ********************************************************************************* OUTPUT
const createOutput = function(settings) {
  const element = el('.output');

  addStyleString(`
    .output {
      background-color: ${ settings.output.backgroundColor };
      font-size: ${ settings.output.fontSize };
      line-height: ${ settings.output.lineHeight };
    }
  `);

  return {
    setValue(html) {
      if (typeof html !== 'undefined') {
        element.innerHTML = html;
      }
    }
  }
}
// ********************************************************************************* SETTINGS
const createSettingsPanel = function(settings, editor) {
  const toggler = el('.settings-button');
  const panel = el('.settings');
  const renderSettings = function () {
    panel.innerHTML = settings.demos.map((demo, demoIdx) => {
      const idx = demoIdx + 1;

      return `
        <div class="demo">
          ${
            demo.frames.map(
              (frame, frameIdx) => {
                const active = editor.demo === demoIdx && editor.frame === frameIdx ? ' active' : '';

                return `<a class="${ active }" href="javascript:updateDemoFrame(${ demoIdx }, ${ frameIdx })"></a>`;
              }
            ).join('')
          }
        </div>
      `
    }).join('');
  }
  const toggle = () => {
    visible = !visible;
    panel.style.display = visible ? 'block' : 'none';
    if (visible) {
      renderSettings();
      toggler.setAttribute('src', './assets/img/close.svg');
    } else {
      toggler.setAttribute('src', './assets/img/laptop.svg');
    }
  }
  let visible = false;

  toggler.addEventListener('click', toggle);

  window.updateDemoFrame = function (demo, frame) {
    editor.showFrame(demo, frame);
    renderSettings();
  }
}


// ********************************************************************************* OTHER
const initColumnResizer = function () {
  let resizable = ColumnResizer.default;
        
  new resizable(
    document.querySelector(".container"),
    {
      resizeMode: 'fit',
      liveDrag: true,
      draggingClass: 'rangeDrag',
      minWidth: 8
    }
  );
}
const getResources = async function (settings) {
  return Promise.all(
    settings.resources.map(resource => {
      return new Promise(done => {
        const extension = resource.split('.').pop().toLowerCase();

        if (extension === 'js') {
          addJSFile(resource, done)
        }
      });
    })
  );
}

// ********************************************************************************* INIT
const initialize = async function (settings) {
  await getResources(settings);
  await loadEditorTheme(settings);

  const output = createOutput(settings);
  const editor = createEditor(settings, html => output.setValue(html));
  const settingsPanel = createSettingsPanel(settings, editor);

  await editor.showFrame();

};

window.onload = async function () {
  initColumnResizer();
  initialize(settings());
};