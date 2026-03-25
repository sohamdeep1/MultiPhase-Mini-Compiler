/**
 * samples/samples.js
 * Pre-written source programs for demonstrating each compiler phase.
 */

const SAMPLES = {

  basic: `// Basic variable declarations and arithmetic
int main() {
    int x = 10;
    int y = 20;
    float pi = 3.14;
    bool flag = true;
    string name = "compiler";

    int sum = x + y;
    float area = pi * x * x;

    if (flag) {
        print(name);
    }

    return sum;
}`,

  loop: `// Loop patterns -- while, for, nested
int factorial(int n) {
    int result = 1;
    int i = 1;
    while (i <= n) {
        result = result * i;
        i = i + 1;
    }
    return result;
}

int sumArray(int n) {
    int total = 0;
    for (int i = 0; i < n; i = i + 1) {
        total = total + i;
    }
    return total;
}

int main() {
    int f = factorial(5);
    int s = sumArray(10);
    print(f);
    print(s);
    return 0;
}`,

  func: `// Function declarations, recursion, scope
int power(int base, int exp) {
    if (exp == 0) {
        return 1;
    }
    return base * power(base, exp - 1);
}

float average(float a, float b) {
    return (a + b) / 2.0;
}

bool isEven(int n) {
    int r = n % 2;
    return r == 0;
}

int main() {
    int p = power(2, 8);
    float avg = average(3.5, 7.5);
    bool even = isEven(42);

    if (even) {
        print("even number");
    }
    return 0;
}`,

  error: `// Program with semantic errors to detect
int main() {
    int x = 10;
    float y = 3.14;

    // Error: undeclared variable
    print(z);

    // Warning: unused variable
    string unused = "hello";

    // Error: type mismatch
    bool flag = x + y;

    // Error: undeclared function
    int r = unknownFn(x);

    return 0;
}`

};
