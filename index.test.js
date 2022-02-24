const format = require('./index');

test('Test format function', () => {
    let number = '10';
    let result = format(number);
    expect(result).toBe('1,0');
});