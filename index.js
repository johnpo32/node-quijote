const fs = require('fs') //libreria para leer texto
const es = require('event-stream') //libreria para Streams
var separador = [] //lee linea por linea del texto
var resultado = [] //array agrupando palabras
var sepExclusiones = [] // Lee linea a linea del texto de palabras descartadas
var resExclusiones = [] //Se agrupa las palabras del texto descartados
const rr = fs.createReadStream('pg2000.txt') //leer el Quijote
const ex = fs.createReadStream('discard_es.txt') //leer discard

// funcion para excluir las palabras descartadas
function excluir() {
  for (var i = 0; i < resExclusiones.length; i++) {
    const search = resultado.findIndex(
      (indice) => indice.palabra === resExclusiones[i]
    )
    if (search != -1) resultado.splice(search, 1)
  }
}
// funcion para ordenar los resultados
function ordenar(a, b) {
  const palabraA = a.cont
  const palabraB = b.cont

  let comparison = 0
  if (palabraA > palabraB) {
    comparison = -1
  } else if (palabraA < palabraB) {
    comparison = 1
  }
  return comparison
}
// Implementacion principal leer textos
rr.pipe(es.split()).pipe(
  es
    .mapSync((line) => {
      // leemos linea por linea y filtramos el texto
      separador = line
        .replace(/[.,-?!;:()"']\s+/g, ' ')
        .replace(/—+/g, '')
        .toLowerCase()
        .trim()
        .split(' ')
      // Vamos llenando un array y contando las coincidencias
      if (line != '')
        for (var i = 0; i < separador.length; i++) {
          const search = resultado.findIndex(
            (indice) => indice.palabra === separador[i]
          )
          if (search == -1) resultado.push({ palabra: separador[i], cont: 1 })
          else resultado[search].cont++
        }
    })
    // En caso de error de lectura
    .on('error', (err) => {
      console.log('Error del Quijote ', err)
    })
    .on('end', () => {
      // En este punto ya se termino de agrupar por coincidencias
      // el libro, ahora excluimos las palabras descartadas
      ex.pipe(es.split()).pipe(
        es
          .mapSync((line) => {
            sepExclusiones = line.trim().split(/(\r?\n)/)
            for (var i = 0; i < sepExclusiones.length; i++) {
              resExclusiones.push(sepExclusiones[i])
            }
          })
          // En caso de error de lectura
          .on('error', (err) => {
            console.log('Error en e archivo de descartados ', err)
          })
          .on('end', () => {
            // PARA FINALIZAR
            // Llamamos la funcion excluir
            excluir()
            // Llamamos la funcion ordenar
            resultado.sort(ordenar)
            // Resultado final
            for (var i = 0; i < 10; i++)
              console.log(i, '. ', resultado[i].palabra, ' ', resultado[i].cont)
          })
      )
    })
)
