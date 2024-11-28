import { describe, expect, test } from "vitest";
import { parser } from "./ffmacro-parser";

describe("parser", () => {
  testHelper("single line macro", "/매크로오류 끄기", [
    {
      node: {
        type: "command",
        name: "매크로오류",
        args: [
          {
            type: "command-arg",
            value: "끄기",
          },
        ],
      },
      wait: 0,
    },
  ]);
  testHelper("multi-line macro", "/매크로오류 끄기\n/인사\n안녕하세요", [
    {
      node: {
        type: "command",
        name: "매크로오류",
        args: [
          {
            type: "command-arg",
            value: "끄기",
          },
        ],
      },
      wait: 0,
    },
    {
      node: {
        type: "command",
        name: "인사",
        args: [],
      },
      wait: 0,
    },
    {
      node: [
        {
          type: "text",
          value: "안녕하세요",
        },
      ],
      wait: 0,
    },
  ]);
  describe("args", () => {
    testHelper("string", `/아이콘 "내 초코보" 탈것`, [
      {
        node: {
          type: "command",
          name: "아이콘",
          args: [
            {
              type: "command-arg",
              value: "내 초코보",
            },
            {
              type: "command-arg",
              value: "탈것",
            },
          ],
        },
        wait: 0,
      },
    ]);
  });

  describe("text", () => {
    testHelper("text", "안녕하세요", [
      {
        node: [
          {
            type: "text",
            value: "안녕하세요",
          },
        ],
        wait: 0,
      },
    ]);
    testHelper(
      "with placeholder",
      "안녕하세요 저는 <me> 입니다. 당신은<t>입니까?",
      [
        {
          node: [
            {
              type: "text",
              value: "안녕하세요 저는 ",
            },
            {
              type: "placeholder",
              key: "me",
              value: undefined,
            },
            {
              type: "text",
              value: " 입니다. 당신은",
            },
            {
              type: "placeholder",
              key: "t",
              value: undefined,
            },
            {
              type: "text",
              value: "입니까?",
            },
          ],
          wait: 0,
        },
      ]
    );
    testHelper("with wait", "안<wait>녕\n하<wait>세\n요", [
      {
        node: [
          {
            type: "text",
            value: "안",
          },
        ],
        wait: 1,
      },
      {
        node: [
          {
            type: "text",
            value: "하",
          },
        ],
        wait: 1,
      },
      {
        node: [
          {
            type: "text",
            value: "요",
          },
        ],
        wait: 0,
      },
    ]);
  });

  describe("wait", () => {
    testHelper("<wait.1>", `/기술시전 "단체 질주" <wait.1>`, [
      {
        node: {
          type: "command",
          name: "기술시전",
          args: [
            {
              type: "command-arg",
              value: "단체 질주",
            },
          ],
        },
        wait: 1,
      },
    ]);

    testHelper(
      "implicit parameter should be set to wait for 1 second",
      `/기술시전 "단체 질주" <wait>`,
      [
        {
          node: {
            type: "command",
            name: "기술시전",
            args: [
              {
                type: "command-arg",
                value: "단체 질주",
              },
            ],
          },
          wait: 1,
        },
      ]
    );

    testHelper(
      "decimal number should be rounded to the nearest integer #1",
      `/기술시전 "단체 질주" <wait.5.3>`,
      [
        {
          node: {
            type: "command",
            name: "기술시전",
            args: [
              {
                type: "command-arg",
                value: "단체 질주",
              },
            ],
          },
          wait: 5,
        },
      ]
    );

    testHelper(
      "decimal number should be rounded to the nearest integer #2",
      `/기술시전 "단체 질주" <wait.7.5>`,
      [
        {
          node: {
            type: "command",
            name: "기술시전",
            args: [
              {
                type: "command-arg",
                value: "단체 질주",
              },
            ],
          },
          wait: 8,
        },
      ]
    );

    testHelper(
      "if multiple wait statements appear, only the first wait statement should be selected, and all tokens following it must be ignored",
      `/? ? <wait.5> <wait.3>
text<wait.1><wait.2>
<wait.1>/?<wait.2> ? <wait.3> <wait.4>`,
      [
        {
          node: {
            type: "command",
            name: "?",
            args: [
              {
                type: "command-arg",
                value: "?",
              },
            ],
          },
          wait: 5,
        },
        {
          node: [
            {
              type: "text",
              value: "text",
            },
          ],
          wait: 1,
        },
        null,
      ]
    );
  });
});

function testHelper(
  name: string,
  code: string,
  expected: ReturnType<typeof parser>
) {
  test(name, () => {
    expect(parser(code)).toStrictEqual(expected);
  });
}
