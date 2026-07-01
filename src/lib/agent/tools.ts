import type { ChatCompletionTool } from "openai/resources/chat/completions";

export const AGENT_TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_current_time",
      description: "获取当前时间（北京时间）。用于确认今天是哪一天、星期几，确保回答中使用正确的日期信息。当用户询问'今天''现在''当前时间'或需要确认日期时使用。",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_university_web",
      description: "【联网搜索专用】为指定大学列表搜索最新录取数据（录取分数、位次、招生政策）。在调用 recommend_volunteer_list 获得推荐列表后，立即调用本工具为推荐院校搜索实时数据。接受大学名称数组或省份+年份的通用查询。",
      parameters: {
        type: "object",
        properties: {
          universities: { type: "array", items: { type: "string" }, description: "要搜索的大学名称列表，如 [\"清华大学\", \"北京大学\"]" },
          query: { type: "string", description: "自定义搜索关键词，当 universities 为空时使用" },
          province: { type: "string", description: "省份" },
          year: { type: "string", description: "年份，如 \"2025\"" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_universities",
      description: "按省份、分数范围、院校标签、城市、类型或专业搜索大学。用户问「帮我找学校」「推荐几所大学」「XX分能上什么学校」时调用。",
      parameters: {
        type: "object",
        properties: {
          province: { type: "string", description: "省份，如「江西」「北京」" },
          minScore: { type: "number", description: "最低分数" },
          maxScore: { type: "number", description: "最高分数" },
          tags: { type: "array", items: { type: "string" }, description: "院校标签，如 [\"985\", \"211\", \"双一流\"]" },
          cityPreference: { type: "string", description: "城市偏好，如「北京」「上海」" },
          typePreference: { type: "string", description: "院校类型，如「综合」「理工」「师范」" },
          majorPreference: { type: "string", description: "目标专业名称" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_university_detail",
      description: "查询某所大学的详细信息：地址、官网、开设专业、招生计划等。用户问「XX大学怎么样」「XX大学有什么专业」「XX大学好不好」时调用。",
      parameters: {
        type: "object",
        properties: {
          universityId: { type: "string", description: "大学 ID，如「tsinghua」(清华)、「pku」(北大)" },
        },
        required: ["universityId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_score_lines",
      description: "查询某所大学在指定省份的历年录取分数线。用户问「XX大学要多少分」「XX大学录取分数线」时调用。",
      parameters: {
        type: "object",
        properties: {
          universityId: { type: "string", description: "大学 ID" },
          province: { type: "string", description: "考生所在省份" },
          year: { type: "number", description: "录取年份，默认 2024" },
        },
        required: ["universityId", "province"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "analyze_major_fit",
      description: "分析某个专业与考生的匹配度，结合兴趣、职业目标和人格类型。用户问「我适合学XX吗」「XX专业适合我吗」「XX专业学什么」时调用。",
      parameters: {
        type: "object",
        properties: {
          majorId: { type: "string", description: "专业 ID，如「cs」(计算机)、「ai」(人工智能)、「fin」(金融)" },
          studentInterests: { type: "string", description: "考生兴趣描述" },
          careerGoals: { type: "string", description: "职业目标" },
          personalityType: { type: "string", description: "人格类型 ID，如「analyst」(分析师型)、「strategist」(战略家型)" },
        },
        required: ["majorId", "studentInterests"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_career_prospects",
      description: "查询某个专业的就业前景、薪资范围、热门就业城市和行业趋势。用户问「XX专业就业怎么样」「XX专业工资多少」「XX专业前景」时调用。",
      parameters: {
        type: "object",
        properties: {
          majorId: { type: "string", description: "专业 ID" },
        },
        required: ["majorId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_major_ranking",
      description: "查询某专业的院校排名，或列出某类别下的所有专业。用户问「XX专业哪个学校最好」「推荐一些工科专业」时调用。",
      parameters: {
        type: "object",
        properties: {
          majorId: { type: "string", description: "专业 ID（查询具体专业排名时必填）" },
          category: { type: "string", description: "专业类别，如「工学」「理学」「文学」" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "recommend_volunteer_list",
      description: "【核心推荐工具】根据分数、省份、兴趣和风险偏好，生成冲刺/稳妥/保底三档院校列表。用户提供分数+省份后必须主动调用一次。",
      parameters: {
        type: "object",
        properties: {
          province: { type: "string", description: "考生所在省份" },
          score: { type: "number", description: "考生高考分数" },
          subjects: { type: "array", items: { type: "string" }, description: "考生选考科目，如 [\"物理\", \"化学\"]" },
          interests: { type: "string", description: "兴趣方向描述" },
          personalityType: { type: "string", description: "人格类型 ID" },
          riskPreference: { type: "string", enum: ["aggressive", "balanced", "conservative"], description: "风险偏好：aggressive=激进、balanced=平衡（默认）、conservative=保守" },
        },
        required: ["province", "score"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_risk_assessment",
      description: "评估志愿方案的风险。用户问「帮我看看这个方案」「这个志愿表稳不稳」「帮我评估下」时调用。",
      parameters: {
        type: "object",
        properties: {
          selectedUniversities: { type: "array", items: { type: "string" }, description: "已选院校 ID 列表" },
          studentScore: { type: "number", description: "考生分数" },
          province: { type: "string", description: "考生省份" },
        },
        required: ["selectedUniversities", "studentScore", "province"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_same_score_destinations",
      description: "查询同分考生去了哪些大学。用户问「XX分能上什么」「同分的人都去了哪」时调用。",
      parameters: {
        type: "object",
        properties: {
          score: { type: "number", description: "考生分数" },
          province: { type: "string", description: "考生省份" },
          year: { type: "number", description: "年份，默认 2024" },
        },
        required: ["score", "province"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "compare_universities",
      description: "对比多所大学的详细信息（分数、专业、城市、就业等）。用户问「XX和YY哪个好」「帮我对比下这几所学校」时调用。",
      parameters: {
        type: "object",
        properties: {
          universityIds: { type: "array", items: { type: "string" }, description: "大学 ID 列表，至少 2 个" },
        },
        required: ["universityIds"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_city_living_cost",
      description: "查询某城市的生活成本（食宿、交通等）。用户问「XX城市消费高吗」「XX城市生活费多少」时调用。",
      parameters: {
        type: "object",
        properties: {
          city: { type: "string", description: "城市名称" },
        },
        required: ["city"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "estimate_equivalent_score",
      description: "根据模考成绩估算高考等效分。用户提到「模考」「一模」「二模」分数时调用。",
      parameters: {
        type: "object",
        properties: {
          mockScore: { type: "number", description: "模考分数" },
          province: { type: "string", description: "考生省份" },
          mockType: { type: "string", description: "模考类型，如「一模」「二模」「三模」" },
        },
        required: ["mockScore", "province"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_province_portal",
      description: "获取某省考试院的官方网址（查分、填报、招生计划）。用户问「在哪里查分」「填报志愿的网址」时调用。",
      parameters: {
        type: "object",
        properties: {
          province: { type: "string", description: "省份名称" },
        },
        required: ["province"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_subject_compatibility",
      description: "【极其重要】检查考生选考科目（3+1+2 模式）与目标专业的匹配度。推荐专业前必须先调用本工具！教育部规定：绝大多数工科、医科专业要求同时选考「物理+化学」，不选化学将无法报考。",
      parameters: {
        type: "object",
        properties: {
          subjects: { type: "array", items: { type: "string" }, description: "考生选考科目，如 [\"物理\", \"化学\", \"生物\"]" },
          majorId: { type: "string", description: "可选：指定专业 ID（检查某专业是否可报）" },
          province: { type: "string", description: "可选：考生省份" },
        },
        required: ["subjects"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_province_score_lines",
      description: "【真实数据】获取某省的高考批次线（如「本科批物理」「特殊类型招生控制线」），来自 30+ 省考试院官方数据，绝对不要猜测。",
      parameters: {
        type: "object",
        properties: {
          province: { type: "string", description: "省份名称" },
          year: { type: "number", description: "年份，默认 2024" },
        },
        required: ["province"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "score_rank_convert",
      description: "【核心工具】分数 ↔ 位次 换算，或计算历年等效分。必须用位次对比而非「分数减线」！",
      parameters: {
        type: "object",
        properties: {
          province: { type: "string", description: "省份名称" },
          score: { type: "number", description: "分数" },
          direction: { type: "string", enum: ["score2rank", "rank2score"], description: "score2rank=分转位次（默认），rank2score=位次转分" },
        },
        required: ["province", "score"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_major_groups",
      description: "【新高考核心】搜索「院校专业组」—— 这是新高考投档的最小单位。按省份、分数、选科筛选，返回带调剂风险标识的候选专业组。",
      parameters: {
        type: "object",
        properties: {
          province: { type: "string", description: "考生省份" },
          score: { type: "number", description: "考生分数" },
          subjects: { type: "array", items: { type: "string" }, description: "考生选考科目，如 [\"物理\", \"化学\"]" },
          tolerance: { type: "number", description: "分数容差窗口，默认 30 分" },
        },
        required: ["province", "score"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "analyze_major_group",
      description: "深度分析指定「院校专业组」：投档线、调剂风险、组内专业分差、录取概率预测。用户问「XX大学XX组怎么样」「这个组稳不稳」时调用。",
      parameters: {
        type: "object",
        properties: {
          groupId: { type: "string", description: "专业组 ID" },
          studentScore: { type: "number", description: "考生分数" },
          acceptAdjustment: { type: "boolean", description: "是否服从专业调剂（默认 true）" },
        },
        required: ["groupId", "studentScore"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "web_search",
      description: "联网搜索最新信息。用于查询实时数据、最新政策、2024年以后的录取分数线、最新招生政策变化、就业前景趋势等本地数据中没有的最新信息。当用户询问'最新''2025年''今年''最近'等时间敏感问题时优先使用。",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "搜索关键词，如「2025年山东高考分数线」「2025年计算机专业就业趋势」" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_personality_analysis",
      description: "获取人格类型分析或从四维评分反推人格。用户分享「我的测评结果是XX型」或刚做完人格测试时调用。",
      parameters: {
        type: "object",
        properties: {
          personalityId: { type: "string", description: "人格类型 ID，如「analyst」" },
          dims: { type: "array", items: { type: "number" }, description: "四维评分 [信息获取, 决策方式, 情绪倾向, 自我认知]" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_volunteer_table",
      description: "生成格式化志愿表（包含冲-稳-保排列建议和调剂提醒）。用户确定最终志愿时调用。",
      parameters: {
        type: "object",
        properties: {
          selections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                universityId: { type: "string" },
                majorId: { type: "string" },
                category: { type: "string", enum: ["reach", "match", "safe"], description: "reach=冲刺, match=稳妥, safe=保底" },
                notes: { type: "string" },
              },
            },
          },
          studentInfo: {
            type: "object",
            properties: {
              name: { type: "string" },
              score: { type: "number" },
              province: { type: "string" },
              rank: { type: "number" },
            },
          },
        },
        required: ["selections"],
      },
    },
  },
];
