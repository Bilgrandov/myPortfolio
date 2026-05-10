Ini adalah pengalaman pertama saya menyelesaikan problem Competitive Programming (CP). Awalnya, saya sama sekali tidak tahu apa maksud dari problem *Sum of 1D Array*. Namun, setelah melihat contoh *output*-nya, saya mulai paham.

Tantangan terbesar yang saya hadapi adalah memahami bagaimana array tersebut dicetak pada iterasi pertama. Saya sempat *struggling* dan bertanya-tanya bagaimana nilai di indeks ke-0 terbentuk. Setelah berdiskusi dengan AI (Gemini), saya menyadari bahwa nilai awal (indeks 0) dibiarkan seperti aslinya, lalu nilai pada indeks setelahnya ditimpa (*overwrite*) dengan hasil penjumlahan baru secara berurutan.

### Pendekatan Solusi
Dari problem ini, saya belajar bahwa ada dua *best practice* yang bisa dipertimbangkan:

1. **Tanpa Inisialisasi (In-place):** Kita langsung mengubah array aslinya. Pendekatan ini sangat efisien karena *Space Complexity*-nya `O(1)`. Pendekatan ini yang paling cocok untuk problem CP ini.
2. **Dengan Inisialisasi (Array Baru):** Pendekatan ini lebih disukai di industri karena tidak merubah data asli (*Immutable*), namun kekurangannya adalah mengorbankan efisiensi memori karena *Space Complexity*-nya menjadi `O(n)`.

Problem sederhana ini benar-benar membuka mata saya betapa pentingnya memahami *Time & Space Complexity* dalam ngoding!

---
### Kode Solusi

Berikut adalah hasil *solve* kode saya menggunakan PHP:

```php
class Solution {

    /**
     * @param Integer[] $nums
     * @return Integer[]
     */
    function runningSum($nums) {
    for ($i = 1; $i < count($nums); $i++) {
        $nums[$i] = $nums[$i] + $nums[$i - 1];
    }
    return $nums;
    }
}
```
