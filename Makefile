SOURCES  = dist/martinez.js
COMPILED = dist/martinez.min.js
QS       = compilation_level=ADVANCED_OPTIMIZATIONS&output_format=text
URL      = http://closure-compiler.appspot.com/compile

all: clean sources compile

clean:
	@rm -rf dist/*

dist/martinez.js:
	@npm run build

sources: ${SOURCES}

compile: ${COMPILED}

%.min.js: %.js
	@echo " - $(<) -> $(@)";
	@curl --silent --show-error --data-urlencode "js_code@$(<)" --data-urlencode "js_externs@src/externs.js" \
	 --data "${QS}&output_info=compiled_code" ${URL} -o $(@)