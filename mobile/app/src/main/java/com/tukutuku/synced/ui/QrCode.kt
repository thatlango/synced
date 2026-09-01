package com.tukutuku.synced.ui
import android.graphics.Bitmap
import androidx.compose.foundation.Image
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter
@Composable fun QrCode(value:String,modifier:Modifier=Modifier){val image=remember(value){val m=QRCodeWriter().encode(value,BarcodeFormat.QR_CODE,512,512);val b=Bitmap.createBitmap(512,512,Bitmap.Config.ARGB_8888);for(x in 0 until 512)for(y in 0 until 512)b.setPixel(x,y,if(m[x,y])android.graphics.Color.BLACK else android.graphics.Color.WHITE);b.asImageBitmap()};Image(image,null,modifier)}
