# 🧪 Test Cases for Multi-Language Support

## Test Case 1: Python Example

**Code:**
```python
def process(data):
    result = []
    for i in data:
        result.append(i * 2)
    return result
```

**Comments:**
- Function name is unclear
- No type hints
- Inefficient list building

**Expected Output:** Python-specific suggestions with list comprehensions, type hints, and PEP 8 compliance.

---

## Test Case 2: JavaScript Example

**Code:**
```javascript
function getData() {
    var data = fetch('/api/data');
    return data;
}
```

**Comments:**
- Uses old var syntax
- Missing error handling
- No async/await

**Expected Output:** Modern JavaScript suggestions with const/let, async/await, and error handling.

---

## Test Case 3: C++ Example

**Code:**
```cpp
void sort(int arr[], int n) {
    for(int i = 0; i < n-1; i++) {
        for(int j = 0; j < n-i-1; j++) {
            if(arr[j] > arr[j+1]) {
                int temp = arr[j];
                arr[j] = arr[j+1];
                arr[j+1] = temp;
            }
        }
    }
}
```

**Comments:**
- Inefficient bubble sort
- No const correctness
- Raw array parameters

**Expected Output:** C++ specific suggestions with std::vector, const correctness, and STL algorithms.

---

## Testing Instructions

1. Select different languages from the dropdown
2. Paste the corresponding test code
3. Add the test comments
4. Generate empathetic review
5. Verify language-specific suggestions appear
