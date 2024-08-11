async function main() {
  const adapter: GPUAdapter | null = await navigator.gpu?.requestAdapter();
  const device: GPUDevice | undefined = await adapter?.requestDevice();
  if (!device) {
    fail("need a browser that supports WebGPU");
    return;
  }

  // Get a WebGPU context from the canvas and configure it
  const canvas = document.querySelector("canvas");
  const context: GPUCanvasContext = <GPUCanvasContext>canvas?.getContext("webgpu");
  const presentationFormat: GPUTextureFormat = <GPUTextureFormat>navigator.gpu.getPreferredCanvasFormat();
  if (!context) {
    fail("failed to get WebGPU context");
    return;
  }

  context.configure({
    device,
    format: presentationFormat,
  });

  const vertexShader: GPUShaderModule = device.createShaderModule({
    label: "our hardcoded red triangle vertex shaders",
    code: `
      @vertex fn vs(
        @builtin(vertex_index) vertexIndex : u32
      ) -> @builtin(position) vec4f {
        let pos = array(
          vec2f( 0.0,  0.5),  // top center
          vec2f(-0.5, -0.5),  // bottom left
          vec2f( 0.5, -0.5)   // bottom right
        );

        return vec4f(pos[vertexIndex], 0.0, 1.0);
      }
    `,
  });

  const fragmentShader: GPUShaderModule = device.createShaderModule({
    label: "our hardcoded red triangle fragment shaders",
    code: `
      @fragment fn fs() -> @location(0) vec4f {
        return vec4f(1, 0, 0, 1);
      }
    `,
  });

  const pipeline = device.createRenderPipeline({
    label: "our hardcoded red triangle pipeline",
    layout: "auto",
    vertex: {
      module: vertexShader,
    },
    fragment: {
      module: fragmentShader,
      targets: [{ format: presentationFormat }],
    },
  });

  const renderPassDescriptor: GPURenderPassDescriptor = {
    label: "our basic canvas renderPass",
    colorAttachments: [
      {
        view: context.getCurrentTexture().createView(),
        clearValue: [0.3, 0.3, 0.3, 1],
        loadOp: "clear",
        storeOp: "store",
      },
    ],
  };

  function render() {
    // Get the current texture from the canvas context and
    // set it as the texture to render to.

    // make a command encoder to start encoding commands
    const encoder = device?.createCommandEncoder({ label: "our encoder" });

    // make a render pass encoder to encode render specific commands
    const pass = encoder?.beginRenderPass(renderPassDescriptor);
    pass?.setPipeline(pipeline);
    pass?.draw(3); // call our vertex shader 3 times.
    pass?.end();

    const commandBuffer = encoder?.finish();
    if (commandBuffer) device?.queue.submit([commandBuffer]);
  }

  render();
}

function fail(msg: string) {
  // eslint-disable-next-line no-alert
  alert(msg);
}

main();
