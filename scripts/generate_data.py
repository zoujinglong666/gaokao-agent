# -*- coding: utf-8 -*-
import json, os, time

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE, 'src', 'lib', 'data')
os.makedirs(DATA_DIR, exist_ok=True)

def generate_province_portals():
    portals = [
        {'province': '北京', 'examInstituteUrl': 'https://www.bjeea.cn', 'scoreCheckUrl': 'https://www.bjeea.cn/html/gkgd/index.html', 'volunteerSystemUrl': 'https://gaokao.bjeea.cn', 'scoreTableUrl': 'https://www.bjeea.cn/html/gkgd/index.html'},
        {'province': '天津', 'examInstituteUrl': 'http://www.zhaokao.net', 'scoreCheckUrl': 'http://www.zhaokao.net', 'volunteerSystemUrl': 'http://www.zhaokao.net', 'scoreTableUrl': 'http://www.zhaokao.net'},
        {'province': '河北', 'examInstituteUrl': 'http://www.hebeea.edu.cn', 'scoreCheckUrl': 'http://www.hebeea.edu.cn/html/gkcx/gkcf.html', 'volunteerSystemUrl': 'http://www.hebeea.edu.cn', 'scoreTableUrl': 'http://www.hebeea.edu.cn'},
        {'province': '山西', 'examInstituteUrl': 'http://www.sxkszx.cn', 'scoreCheckUrl': 'http://www.sxkszx.cn/news/gkcx/', 'volunteerSystemUrl': 'http://www.sxkszx.cn', 'scoreTableUrl': 'http://www.sxkszx.cn'},
        {'province': '内蒙古', 'examInstituteUrl': 'https://www.nm.zsks.cn', 'scoreCheckUrl': 'https://www.nm.zsks.cn', 'volunteerSystemUrl': 'https://www.nm.zsks.cn', 'scoreTableUrl': 'https://www.nm.zsks.cn'},
        {'province': '辽宁', 'examInstituteUrl': 'https://www.lnzsks.com', 'scoreCheckUrl': 'https://www.lnzsks.com', 'volunteerSystemUrl': 'https://www.lnzsks.com', 'scoreTableUrl': 'https://www.lnzsks.com'},
        {'province': '吉林', 'examInstituteUrl': 'http://www.jleea.edu.cn', 'scoreCheckUrl': 'http://www.jleea.edu.cn', 'volunteerSystemUrl': 'http://www.jleea.edu.cn', 'scoreTableUrl': 'http://www.jleea.edu.cn'},
        {'province': '黑龙江', 'examInstituteUrl': 'https://www.lzk.hl.cn', 'scoreCheckUrl': 'https://www.lzk.hl.cn', 'volunteerSystemUrl': 'https://www.lzk.hl.cn', 'scoreTableUrl': 'https://www.lzk.hl.cn'},
        {'province': '上海', 'examInstituteUrl': 'https://www.shmeea.edu.cn', 'scoreCheckUrl': 'https://www.shmeea.edu.cn/page/20600/index.html', 'volunteerSystemUrl': 'https://www.shmeea.edu.cn', 'scoreTableUrl': 'https://www.shmeea.edu.cn'},
        {'province': '江苏', 'examInstituteUrl': 'https://www.jseea.cn', 'scoreCheckUrl': 'https://www.jseea.cn', 'volunteerSystemUrl': 'https://gk.jseea.cn', 'scoreTableUrl': 'https://www.jseea.cn'},
        {'province': '浙江', 'examInstituteUrl': 'https://www.zjzs.net', 'scoreCheckUrl': 'https://www.zjzs.net', 'volunteerSystemUrl': 'https://www.zjzs.net', 'scoreTableUrl': 'https://www.zjzs.net'},
        {'province': '安徽', 'examInstituteUrl': 'https://www.ahzsks.cn', 'scoreCheckUrl': 'https://www.ahzsks.cn', 'volunteerSystemUrl': 'https://www.ahzsks.cn', 'scoreTableUrl': 'https://www.ahzsks.cn'},
        {'province': '福建', 'examInstituteUrl': 'https://www.eeafj.cn', 'scoreCheckUrl': 'https://www.eeafj.cn', 'volunteerSystemUrl': 'https://www.eeafj.cn', 'scoreTableUrl': 'https://www.eeafj.cn'},
        {'province': '江西', 'examInstituteUrl': 'http://www.jxeea.cn', 'scoreCheckUrl': 'http://www.jxeea.cn', 'volunteerSystemUrl': 'http://www.jxeea.cn', 'scoreTableUrl': 'http://www.jxeea.cn'},
        {'province': '山东', 'examInstituteUrl': 'https://www.sdzk.cn', 'scoreCheckUrl': 'https://www.sdzk.cn', 'volunteerSystemUrl': 'https://www.sdzk.cn', 'scoreTableUrl': 'https://www.sdzk.cn'},
        {'province': '河南', 'examInstituteUrl': 'http://www.haeea.cn', 'scoreCheckUrl': 'http://www.haeea.cn', 'volunteerSystemUrl': 'http://www.haeea.cn', 'scoreTableUrl': 'http://www.haeea.cn'},
        {'province': '湖北', 'examInstituteUrl': 'http://www.hbea.edu.cn', 'scoreCheckUrl': 'http://www.hbea.edu.cn', 'volunteerSystemUrl': 'http://www.hbea.edu.cn', 'scoreTableUrl': 'http://www.hbea.edu.cn'},
        {'province': '湖南', 'examInstituteUrl': 'https://jyt.hunan.gov.cn/jyt/sjyt/hnsjyksy/', 'scoreCheckUrl': 'https://jyt.hunan.gov.cn/jyt/sjyt/hnsjyksy/', 'volunteerSystemUrl': 'https://jyt.hunan.gov.cn/jyt/sjyt/hnsjyksy/', 'scoreTableUrl': 'https://jyt.hunan.gov.cn/jyt/sjyt/hnsjyksy/'},
        {'province': '广东', 'examInstituteUrl': 'https://eea.gd.gov.cn', 'scoreCheckUrl': 'https://eea.gd.gov.cn', 'volunteerSystemUrl': 'https://eea.gd.gov.cn', 'scoreTableUrl': 'https://eea.gd.gov.cn'},
        {'province': '广西', 'examInstituteUrl': 'https://www.gxeea.cn', 'scoreCheckUrl': 'https://www.gxeea.cn', 'volunteerSystemUrl': 'https://www.gxeea.cn', 'scoreTableUrl': 'https://www.gxeea.cn'},
        {'province': '海南', 'examInstituteUrl': 'https://ea.hainan.gov.cn', 'scoreCheckUrl': 'https://ea.hainan.gov.cn', 'volunteerSystemUrl': 'https://ea.hainan.gov.cn', 'scoreTableUrl': 'https://ea.hainan.gov.cn'},
        {'province': '重庆', 'examInstituteUrl': 'https://www.cqksy.cn', 'scoreCheckUrl': 'https://www.cqksy.cn/site/index.html', 'volunteerSystemUrl': 'https://www.cqksy.cn', 'scoreTableUrl': 'https://www.cqksy.cn'},
        {'province': '四川', 'examInstituteUrl': 'https://www.scea.cn', 'scoreCheckUrl': 'https://www.scea.cn', 'volunteerSystemUrl': 'https://www.scea.cn', 'scoreTableUrl': 'https://www.scea.cn'},
        {'province': '贵州', 'examInstituteUrl': 'http://www.eaagz.org.cn', 'scoreCheckUrl': 'http://www.eaagz.org.cn', 'volunteerSystemUrl': 'http://www.eaagz.org.cn', 'scoreTableUrl': 'http://www.eaagz.org.cn'},
        {'province': '云南', 'examInstituteUrl': 'https://www.ynzs.cn', 'scoreCheckUrl': 'https://www.ynzs.cn', 'volunteerSystemUrl': 'https://www.ynzs.cn', 'scoreTableUrl': 'https://www.ynzs.cn'},
        {'province': '西藏', 'examInstituteUrl': 'http://zsks.edu.xizang.gov.cn', 'scoreCheckUrl': 'http://zsks.edu.xizang.gov.cn', 'volunteerSystemUrl': 'http://zsks.edu.xizang.gov.cn', 'scoreTableUrl': 'http://zsks.edu.xizang.gov.cn'},
        {'province': '陕西', 'examInstituteUrl': 'https://www.sneea.cn', 'scoreCheckUrl': 'https://www.sneea.cn', 'volunteerSystemUrl': 'https://www.sneea.cn', 'scoreTableUrl': 'https://www.sneea.cn'},
        {'province': '甘肃', 'examInstituteUrl': 'https://www.ganseea.cn', 'scoreCheckUrl': 'https://www.ganseea.cn', 'volunteerSystemUrl': 'https://www.ganseea.cn', 'scoreTableUrl': 'https://www.ganseea.cn'},
        {'province': '青海', 'examInstituteUrl': 'http://www.qhjyks.com', 'scoreCheckUrl': 'http://www.qhjyks.com', 'volunteerSystemUrl': 'http://www.qhjyks.com', 'scoreTableUrl': 'http://www.qhjyks.com'},
        {'province': '宁夏', 'examInstituteUrl': 'https://www.nxjyks.cn', 'scoreCheckUrl': 'https://www.nxjyks.cn', 'volunteerSystemUrl': 'https://www.nxjyks.cn', 'scoreTableUrl': 'https://www.nxjyks.cn'},
        {'province': '新疆', 'examInstituteUrl': 'https://www.xjzk.gov.cn', 'scoreCheckUrl': 'https://www.xjzk.gov.cn', 'volunteerSystemUrl': 'https://www.xjzk.gov.cn', 'scoreTableUrl': 'https://www.xjzk.gov.cn'},
    ]
    data = {
        '_comment': '各省高考查分/志愿填报官方入口 - 请人工审核每个URL的可访问性',
        '_source': '各省教育考试院官网',
        '_updateDate': time.strftime('%Y-%m-%d'),
        'portals': portals
    }
    with open(os.path.join(DATA_DIR, 'province-portals.json'), 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f'province-portals.json: {len(portals)} provinces')

if __name__ == '__main__':
    generate_province_portals()
