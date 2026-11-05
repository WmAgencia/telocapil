export default function handler(req,res){
 if(req.method!=='GET')return res.status(405).end();
 res.setHeader('Cache-Control','no-store');
 const enabled=process.env.META_TRACKING_ENABLED==='true';
 return res.status(200).json({enabled,pixelId:enabled?(process.env.META_PIXEL_ID||null):null,capiConfigured:enabled&&process.env.META_PIXEL_ID==='2302179570557964'&&Boolean(process.env.META_ACCESS_TOKEN)});
}
