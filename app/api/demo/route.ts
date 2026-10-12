import demo from '../../../data/demo.json';
export function GET(request:Request){
  if(new URL(request.url).searchParams.get('format')==='pgn')return new Response(demo.pgn,{headers:{'Content-Type':'application/x-chess-pgn','Content-Disposition':'attachment; filename="validation-game.pgn"'}});
  return Response.json(demo);
}
