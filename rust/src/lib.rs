use wasm_bindgen::prelude::*;
use flate2::write::{GzEncoder, GzDecoder};
use flate2::Compression;
use std::io::Write;

#[wasm_bindgen]
pub fn compress(data: &[u8]) -> Result<Vec<u8>, JsValue> {
    let mut encoder = GzEncoder::new(Vec::new(), Compression::default());
    encoder.write_all(data)
        .map_err(|e| JsValue::from_str(&format!("Compression failed: {}", e)))?;
    encoder.finish()
        .map_err(|e| JsValue::from_str(&format!("Compression finalization failed: {}", e)))
}

#[wasm_bindgen]
pub fn decompress(data: &[u8]) -> Result<Vec<u8>, JsValue> {
    let mut decoder = GzDecoder::new(Vec::new());
    decoder.write_all(data)
        .map_err(|e| JsValue::from_str(&format!("Decompression failed: {}", e)))?;
    decoder.finish()
        .map_err(|e| JsValue::from_str(&format!("Decompression finalization failed: {}", e)))
}
