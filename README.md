![wasmwhirlwind](wasmwhirlwind.png) 

#### Getting Started

It is useful to have a verifier on a blockchain. However, sometimes you just want to generate and verify proofs in the browser. Thankfully, ezkl supports a WASM environment that you can use to generate proofs and verify them in-browser. For those who are unfamiliar, [**here**](https://developer.mozilla.org/en-US/docs/WebAssembly/Concepts) is a good resource on WASM and [**here**](https://github.com/zkonduit/ezkl/blob/main/src/wasm.rs) you can find the functions we define for ezkl's WASM interface. Let's get started!

First, we need to add the `wasm32-unknown-unknown` target to our rustup configuration.  `wasm32-unknown-unknown` is is a target for creating WebAssembly binaries. The `wasm32` part represents the platform (WASM 32 bit in our case). The first `unknown` specifies the operating system we are building on. We want to build on any operating system since we're just building on browser. The second `unknown` refers to the target's standard library (Rust/C++ `std`), but with WASM, we won't be using one. We add this as a target with:

```bash
rustup target add wasm32-unknown-unknown
```

Note that you should be on Rust's nightly release channel when interacting with ezkl. 

Another thing we need before we get our `.wasm` file is [LLVM](https://llvm.org/). LLVM is a compiler tool that will help us use libraries that are essential for compiling our Rust ezkl code to a WASM binary fit for `wasm32-unknown-unknown`. You can get the latest release [here](https://releases.llvm.org/download.html) (especially for Windows users) or install it with a package manager:

*Linux*

```bash
sudo apt install llvm
sudo apt install clang-12
```



*Mac*: You can use Homebrew to install llvm. This library comes with `clang`, which we'll also need.

```bash
brew install --debug llvm
export PATH=/usr/local/opt/llvm/bin:$PATH
```



After this step, make sure you have access to the `PATH` for both `clang` and `llvm`. We'll be using environment variables such as `CC=/opt/homebrew/opt/llvm/bin/clang` for the remainder of the project. 

Install [wasm-pack](https://rustwasm.github.io/wasm-pack/book/)

```bash
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
```

Now, navigate to your fork or branch of `ezkl` and install the [WASM server runner](https://crates.io/crates/wasm-server-runner):

```bash
cargo install wasm-server-runner
```

With this, we're finally able to compile our .wasm file! You can do that with this command:

```bash
AR=/opt/llvm/bin/llvm-ar  CC=/opt/llvm/bin/clang wasm-pack build --target web . -- -Z build-std="panic_abort,std"
```

Make sure that you supply the correct paths for llvm-ar and clang (AR and CC). You can use `brew info llvm` on Mac or `dpkg -L llvm` for Linux. 

This command will generate a directory called `pkg` in our root ezkl directory. Within it, you will find these files:

* .gitignore
* ezkl_lib_bg.wasm
* ezkl_lib_bg.wasm.d.ts
* ezkl_lib.d.ts
* ezkl_lib.js
* package.json
* README.md

Remove the .gitignore file if you want to add `pkg` to your root git directory.

If something goes wrong, be certain that the paths to your llvm-ar and clang libraries are correct. Also make sure wasm-pack is installed and that your .cargo/config file in ezkl looks like this:

```txt
[target.wasm32-unknown-unknown]
runner = 'wasm-bindgen-test-runner'
rustflags = ["-C", "target-feature=+atomics,+bulk-memory,+mutable-globals"]
```

### Creating a frontend

Now that we have the wasm-pack package, we can build a simple frontend that uses its exports to prove and verify models (we would love to see projects using this in more intricate ways). Here's what we'll do step-by-step:

We'll be using the `ezkl` library to pass in the **serialized circuit**(.onnx) and **runargs** to our `gen_circuit_params_wasm` function. In order to generate a serialized `runargs` file, you'll need to generate it. You can do this by adding a new Rust file to `ezkl/src/bin` (feel free to call it `genscript.rs`). Paste this code there:
```rust
mod genscript {
    use ezkl_lib::commands::RunArgs;
    use std::fs::File;
    use std::io::Write;
    use ezkl_lib::circuit::Tolerance;
 
    pub fn gen_run_args() {
        let run_args = RunArgs {
            tolerance: Tolerance::default(),
            scale: 7,
            bits: 16,
            logrows: 17,
            batch_size: 1,
            public_inputs: false,
            public_outputs: true,
            public_params: false,
            pack_base: 1,
            allocated_constraints: Some(1000), // assuming an arbitrary value here for the sake of the example
        };
 
 
        let serialized_run_args =
            bincode::serialize(&run_args).expect("Failed to serialize RunArgs");
 
 
        // Write the serialized runargs to a file.
        let mut rafile = File::create("run_args.params").expect("Failed to create file");
        rafile
            .write_all(&serialized_run_args)
            .expect("Failed to write data to file");
    }
 }
 
 
 fn main() {
    genscript::gen_run_args();
 }
 
 
```
From here, feel free to change the RunArgs as you please to make the best SNARK for your circuit. These are the arguments you see [here](https://docs.ezkl.xyz/command_line_interface/). After you run the main function with `cargo run --bin genscript`, you will have a file called `run_args.params`. You can use this as the second parameter for `gen_circuit_params_wasm`.

We will use the `circuit` file generated in this step to pass to our `gen_pk_wasm` function along with our **commitment scheme parameters** (kzg.params) and **serialized circuit**.

After this gives us our `pk.key` file, we will use that along with the **input data**(.json), **the serialized circuit**, **the serialized circuit parameters**, and our **commitment scheme paramenters** to trigger our `prove_wasm` function. 

When the `network.proof` file is created here, we will pass that along with the **verify key** and **serialized circuit parameters** to our `verify_wasm` function. It is important to note that you will have a lot of this information after you create a circuit with `ezkl`. Feel free to store them in your project (perhaps .gitignore-ing them). Now that we know what will happen, let's begin with the frontend. 

1) Make a new directory for your project.
2) copy your new `pkg` directory into the project
3) create an index.html and paste this code in:

```bash
<html>

<head>
    <meta content="text/html;charset=utf-8" http-equiv="Content-Type" />
</head>

<body>
    <script type="module">
        // Importing the necessary functions from the WASM module
        import init, { prove_wasm, verify_wasm, gen_circuit_params_wasm, gen_pk_wasm, gen_vk_wasm } from './pkg/ezkl_lib.js';

        async function run() {
            try {
                // Initialize the WASM module
                await init();

                // Function to read an uploaded file and return its content as a Uint8ClampedArray
                function readUploadedFileAsText(inputFileElement) {
                    return new Promise((resolve, reject) => {
                        const file = inputFileElement.files[0];
                        const reader = new FileReader();

                        reader.onload = event => {
                            const arrayBuffer = event.target.result;
                            resolve(new Uint8ClampedArray(arrayBuffer));
                        };

                        reader.onerror = error => {
                            reject(new Error('File could not be read: ' + error));
                        };

                        reader.readAsArrayBuffer(file);
                    });
                }
                // Adding event listeners for gen_circuit_params_wasm, gen_pk_wasm, gen_vk_wasm
                document.getElementById("genCircuitParamsButton").addEventListener("click", async () => {
                    try {
                        const circuit_ser = await readUploadedFileAsText(document.getElementById("circuit_ser_gen"));
                        const run_args_ser = await readUploadedFileAsText(document.getElementById("run_args_ser_gen"));
                        const result_cp = await gen_circuit_params_wasm(circuit_ser, run_args_ser);

                        document.getElementById("genCircuitParamsResult").innerText = result_cp ? 'Generation successful' : 'Generation failed';

                        // Creating a blob and a URL for it from the result
                        const blob = new Blob([result_cp.buffer], { type: 'application/octet-stream' });
                        const url = URL.createObjectURL(blob);

                        // Creating a hidden anchor element, adding it to the document,
                        // clicking it to download the file and then removing the element
                        const g = document.createElement("a");
                        g.href = url;
                        g.download = 'circuit';
                        g.style.display = 'none';
                        document.body.appendChild(g);
                        g.click();
                        setTimeout(() => {
                            URL.revokeObjectURL(url);
                            document.body.removeChild(g);
                        }, 0);

                        
                    } catch (error) {
                        console.error("An error occurred generating circuit parameters:", error);
                    }
                });

                document.getElementById("genPkButton").addEventListener("click", async () => {
                    try {
                        const circuit_ser = await readUploadedFileAsText(document.getElementById("circuit_ser_pk"));
                        const params_ser = await readUploadedFileAsText(document.getElementById("params_ser_pk"));
                        const circuit_params_ser = await readUploadedFileAsText(document.getElementById("circuit_params_ser_pk"));
                        const result_pk = await gen_pk_wasm(circuit_ser, params_ser, circuit_params_ser);
                        document.getElementById("genPkResult").innerText = result_pk ? 'Generation successful' : 'Generation failed';

                        // Creating a blob and a URL for it from the result
                        const blob = new Blob([result_pk.buffer], { type: 'application/octet-stream' });
                        const url = URL.createObjectURL(blob);

                        // Creating a hidden anchor element, adding it to the document,
                        // clicking it to download the file and then removing the element
                        const pk = document.createElement("a");
                        pk.href = url;
                        pk.download = 'pk.key';
                        pk.style.display = 'none';
                        document.body.appendChild(pk);
                        pk.click();
                        setTimeout(() => {
                            URL.revokeObjectURL(url);
                            document.body.removeChild(pk);
                        }, 0);
                    } catch (error) {
                        console.error("An error occurred generating proving key:", error);
                    }
                });

                document.getElementById("genVkButton").addEventListener("click", async () => {
                    try {
                        const pk_ser = await readUploadedFileAsText(document.getElementById("pk_ser"));
                        const circuit_params_ser = await readUploadedFileAsText(document.getElementById("circuit_params_ser_vk"));
                        const result_vk = await gen_vk_wasm(pk_ser, circuit_params_ser);
                        document.getElementById("genVkResult").innerText = result_vk ? 'Generation successful' : 'Generation failed';

                        // Creating a blob and a URL for it from the result
                        const blob = new Blob([result_vk.buffer], { type: 'application/octet-stream' });
                        const url = URL.createObjectURL(blob);

                        // Creating a hidden anchor element, adding it to the document,
                        // clicking it to download the file and then removing the element
                        const vk = document.createElement("a");
                        vk.href = url;
                        vk.download = 'vk.key';
                        vk.style.display = 'none';
                        document.body.appendChild(vk);
                        vk.click();
                        setTimeout(() => {
                            URL.revokeObjectURL(url);
                            document.body.removeChild(vk);
                        }, 0);
                    } catch (error) {
                        console.error("An error occurred generating verifying key:", error);
                    }
                });

                // Adding an event listener to the proveButton
                document.getElementById("proveButton").addEventListener("click", async () => {
                    try {
                        // Reading the content of the input files
                        const data = await readUploadedFileAsText(document.getElementById("data_prove"));
                        const pk = await readUploadedFileAsText(document.getElementById("pk_prove"));
                        const circuit_ser = await readUploadedFileAsText(document.getElementById("circuit_ser_prove"));
                        const circuit_params_ser = await readUploadedFileAsText(document.getElementById("circuit_params_ser_prove"));
                        const params_ser = await readUploadedFileAsText(document.getElementById("params_ser_prove"));

                        // Using the WASM function to get a result
                        const result = await prove_wasm(data, pk, circuit_ser, circuit_params_ser, params_ser);

                        document.getElementById("proveResult").innerText = result ? 'Proof OK' : 'Proof failed';

                        // Creating a blob and a URL for it from the result
                        const blob = new Blob([result.buffer], { type: 'application/octet-stream' });
                        const url = URL.createObjectURL(blob);

                        // Creating a hidden anchor element, adding it to the document,
                        // clicking it to download the file and then removing the element
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = 'network.proof';
                        a.style.display = 'none';
                        document.body.appendChild(a);
                        a.click();
                        setTimeout(() => {
                            URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                        }, 0);
                    } catch (error) {
                        console.error("An error occurred during proving:", error);
                    }
                });

                // Adding an event listener to the verifyButton
                document.getElementById("verifyButton").addEventListener("click", async () => {
                    try {
                        // Reading the content of the input files
                        const proof_js = await readUploadedFileAsText(document.getElementById("proof_js"));
                        const vk = await readUploadedFileAsText(document.getElementById("vk"));
                        const circuit_params_ser = await readUploadedFileAsText(document.getElementById("circuit_params_ser_verify"));
                        const params_ser = await readUploadedFileAsText(document.getElementById("params_ser_verify"));

                        // Using the WASM function to get a result
                        const result = await verify_wasm(proof_js, vk, circuit_params_ser, params_ser);

                        // Displaying the result
                        document.getElementById("verifyResult").innerText = result ? 'True' : 'False';
                    } catch (error) {
                        console.error("An error occurred during verification:", error);
                    }
                });
            } catch (error) {
                console.error("An error occurred:", error);
            }
        }

        // Running the main function
        run();
    </script>
    <!--HTML forms for the proving and verifying functionality-->
    <div>
        <h1>Generate Circuit Params</h1>
        <label for="circuit_ser_gen">Circuit (.onnx):</label>
        <input id="circuit_ser_gen" type="file" placeholder="circuit_ser_gen" />
        <label for="run_args_ser_gen">Run Args:</label>
        <input id="run_args_ser_gen" type="file" placeholder="run_args_ser_gen" />
        <button id="genCircuitParamsButton">Generate Circuit Params</button>
        <h2>Result:</h2>
        <div id="genCircuitParamsResult"></div>


        <h1>Generate Proving Key</h1>
        <label for="circuit_ser_pk">Circuit (.onnx):</label>
        <input id="circuit_ser_pk" type="file" placeholder="circuit_ser_pk" />
        <label for="params_ser_pk">KZG Params:</label>
        <input id="params_ser_pk" type="file" placeholder="params_ser_pk" />
        <label for="circuit_params_ser_pk">Circuit params:</label>
        <input id="circuit_params_ser_pk" type="file" placeholder="circuit_params_ser_pk" />
        <button id="genPkButton">Generate</button>
        <h2>Result:</h2>
        <div id="genPkResult"></div>

        <h1>Generate Verifying Key</h1>
        <label for="pk_ser">Proving Key:</label>
        <input id="pk_ser" type="file" placeholder="pk_ser" />
        <label for="circuit_params_ser_vk">Circuit params:</label>
        <input id="circuit_params_ser_vk" type="file" placeholder="circuit_params_ser_vk" />
        <button id="genVkButton">Generate Verifying Key</button>
        <h2>Result:</h2>
        <div id="genVkResult"></div>

        <h1>Prove</h1>
        <!--File inputs to upload the necessary files-->
        <label for="data_prove">Input Data:</label>
        <input id="data_prove" type="file" placeholder="data_prove" />
        <label for="pk_prove">Proving key:</label>
        <input id="pk_prove" type="file" placeholder="pk_prove" />
        <label for="circuit_ser_prove">Circuit (.onnx):</label>
        <input id="circuit_ser_prove" type="file" placeholder="circuit_ser" />
        <label for="circuit_params_ser_prove">Circuit params:</label>
        <input id="circuit_params_ser_prove" type="file" placeholder="circuit_params_ser_prove" />
        <label for="params_ser_prove">KZG params:</label>
        <input id="params_ser_prove" type="file" placeholder="params_ser_prove" />
        <!--Button to start the proving process-->
        <button id="proveButton">Prove</button>
        <h2>Result:</h2>
        <!--Placeholder for the proving result-->
        <div id="proveResult"></div>
    </div>
    <div>
        <h1>Verify</h1>
        <!--File inputs to upload the necessary files-->
        <label for="proof_js">Proof (network.proof):</label>
        <input id="proof_js" type="file" placeholder="proof_js" />
        <label for="vk">Verifying key:</label>
        <input id="vk" type="file" placeholder="vk" />
        <label for="circuit_params_ser_verify">Circuit params:</label>
        <input id="circuit_params_ser_verify" type="file" placeholder="circuit_params_ser_verify" />
        <label for="params_ser_verify">KZG params:</label>
        <input id="params_ser_verify" type="file" placeholder="params_ser_verify" />
        <!--Button to start the verification process-->
        <button id="verifyButton">Verify</button>
        <h2>Result:</h2>
        <!--Placeholder for the verification result-->
        <div id="verifyResult"></div>
    </div>
</body>

</html>

```
4) This script generates a simple HTML frontend with fields to pass in files for our input fields (we'll upload them from our ezkl directory). It also calls the `ezkl_lib.js` folder in our pkg to fetch the exported `prove_wasm`, `verify_wasm`, `gen_circuit_params_wasm`, `gen_pk_wasm`, and `gen_vk_wasm` functions.

5) Run a simple http server such as python3's:

   ```
   python3 -m http.server
   ```

6) Finally, upload the corresponding files to each parameter. 

The ordering for `Generate Circuit Params` is:
   * `circuit_ser`: circuit (network.onnx)
   * `RunArgs`: RunArgs generated earlier in the tutorial

The ordering for `Generate Proving Key` is:
   * `circuit_ser`: circuit (network.onnx)
   * `params_ser`: commitment scheme parameters (kzg.params)
   * `circuit_params_ser`: circuit parameters (circuit file generated from the last step)

The ordering for `Generate Verifying Key` is:
   * `pk`: proving key (pk.key)
   * `circuit_params_ser`: circuit parameters (circuit)

The ordering for `Prove` (from left to right) is:
   * `data`: input data (input.json)
   * `pk`: proving key (pk.key)
   * `circuit_ser`: circuit (network.onnx)
   * `circuit_params_ser`: circuit parameters (circuit)
   * `params_ser`: commitment scheme parameters (kzg.params)

This will prompt you to download a file called `network.proof`. `network.proof` is a binary file of the generated proof. Note that this step may take time. After `network.proof` has been downloaded, upload the file to the first value of the `Verify` function. 

The ordering for `Verify` (from left to right) is:

   * `proof_js`: proof (network.proof)
   * `vk`: verifier key (vk.key)
   * `circuit_params_ser`: circuit parameters (circuit)
   * `params_ser`: commitment scheme parameters (kzg.params)

   `True` or `False` should appear as the result for the Verify function.

At the end of the interaction, your screen should look something like:

![verification](verification.png) 


And thus, we have a WASM prover and verifier that you can use for your zkml project without having to worry about the blockchain! Feel free to check out the [source code](https://github.com/lancenonce/wasm-tutorial-web) and build your own zkml applications with this simple interface. Thank you for reading and thank you for using ezkl. 