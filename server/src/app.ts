const clientDist =
  process.env.CLIENT_DIST
    ? path.resolve(process.env.CLIENT_DIST)
    : path.resolve("/app/client/dist");


app.use(express.static(clientDist));


app.get("*",(req,res)=>{

  if(
    req.path.startsWith("/api/") ||
    req.path.startsWith("/v1/")
  ){
    return res.status(404).json({
      error:"Not found"
    });
  }


  res.sendFile(
    path.join(
      clientDist,
      "index.html"
    ),
    err=>{
      if(err){
        res.json({
          status:"FreeLLMAPI API running",
          frontend:"not built"
        });
      }
    }
  );

});