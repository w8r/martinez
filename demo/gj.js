import { createFilter, dataToEsm } from "@rollup/pluginutils"

export default function json(
  options = {
    include: ["**/*.json", "**/*.geojson"],
  },
) {
  const filter = createFilter(options.include, options.exclude)
  const indent = "indent" in options ? options.indent : "\t"

  return {
    name: "geojson",

    // eslint-disable-next-line no-shadow
    transform(json, id) {
      if (!filter(id)) return null
      try {
        const parsed = JSON.parse(json)
        return {
          code: dataToEsm(parsed, {
            preferConst: options.preferConst,
            compact: options.compact,
            namedExports: options.namedExports,
            indent,
          }),
          map: { mappings: "" },
        }
      } catch (err) {
        const message = "Could not parse GeoJSON file"
        const position = parseInt(/[\d]/.exec(err.message)[0], 10)
        this.warn({ message, id, position })
        return null
      }
    },
  }
}
