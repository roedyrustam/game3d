# Dokumentasi Teknis Proyek: Ular Tangga 3D Nusantara

## Arsitektur Procedural 3D (Tanpa File Model Eksternal)
Sesuai arahan, game ini tidak bergantung pada file model 3D eksternal (`.gltf`, `.glb`, `.obj`). Seluruh geometri dibuat secara dinamis menggunakan Three.js:

1. **Papan Permainan**:
   - `BoxGeometry` sebagai basis meja/papan tebal dengan tekstur bevel.
   - 100 petak dihasilkan melalui dynamic canvas texture (angka 1-100 dengan warna-warni kontras retro/nusantara).

2. **Ular 3D**:
   - Dihitung menggunakan kurva 3D `THREE.CatmullRomCurve3` yang menghubungkan kotak kepala dan ekor dengan lekukan S-curve 3 dimensi.
   - `THREE.TubeGeometry` untuk badan ular dengan tekstur sisik prosedural.
   - `THREE.SphereGeometry` + `ConeGeometry` untuk kepala taring dan mata ular.

3. **Tangga 3D**:
   - Tiang samping silinder `THREE.CylinderGeometry` yang miring dari petak bawah ke petak atas.
   - Anak tangga (rungs) yang ditempatkan secara berjarak seragam di sepanjang anak tangga.

4. **Dadu 3D**:
   - `THREE.BoxGeometry` dengan rounded corners / chamfer look.
   - Masing-masing sisi memiliki dot/pip 1 sampai 6 yang dibuat via canvas procedural.

5. **Pion Karakter**:
   - Model bidak catur/piala klasik (`CylinderGeometry` + `SphereGeometry` + `TorusGeometry`) dengan warna pemain (Merah, Biru, Hijau, Kuning).
