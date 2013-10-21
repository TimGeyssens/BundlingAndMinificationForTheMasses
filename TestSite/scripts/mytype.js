function Greeter(greeting) {
    this.greeting = greeting;
}

Greeter.prototype.greet = function () {
    return "Hello, " + this.greeting;
};

var greeter = new Greeter({ message: "world" });

var button = document.createElement('button');
button.textContent = "Say Hello";
button.onclick = function () {
    alert(greeter.greet());
};

document.body.appendChild(button);
