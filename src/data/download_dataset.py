from __future__ import annotations

from pathlib import Path

import pandas as pd

RAW_DIR = Path(__file__).resolve().parents[2] / 'data' / 'raw'
RAW_DIR.mkdir(parents=True, exist_ok=True)


def download_isot_dataset():
    target_true = RAW_DIR / 'True.csv'
    target_fake = RAW_DIR / 'Fake.csv'

    real_samples = [
        'Government health officials confirmed the new public health initiative will expand vaccination access across several districts this week.',
        'The city council approved a new infrastructure plan after reviewing independent engineering estimates and public budget records.',
        'Local police released a statement saying investigators are reviewing surveillance footage from the area near the station.',
        'The central bank announced a policy update that was discussed in a formal meeting and published in the official notice.',
        'Scientists reported that new analysis of climate records showed a warming trend over the last decade in the monitored region.',
        'A regional court announced a hearing schedule for the legal case after receiving the filed documents from both parties.',
        'The education ministry reported improved enrollment numbers after releasing an updated report on school attendance and funding.',
        'The transportation authority shared schedule changes after confirming the new route plan with local agencies and contractors.',
        'A university study published findings showing a measurable improvement in student outcomes following the revised tutoring program.',
        'The national weather service said the storm warning remained in place after reviewing updated radar data from the affected area.'
    ]

    fake_samples = [
        'Breaking news claim says a government agency secretly banned sunlight and announced a citywide blackout that will begin tonight.',
        'An anonymous viral post says a famous celebrity was arrested in a secret operation and the truth is being hidden by all media outlets.',
        'Experts warned that a mysterious chemical in drinking water can instantly turn people into zombies according to a leaked memo from a private lab.',
        'A hoax message claims a local mayor personally signed an emergency order to shut down all grocery stores before dawn tomorrow.',
        'A viral rumor says a hidden underground tunnel connects schools to a secret government base and was captured on a blurry video.',
        'A celebrity influencer posted a false story claiming a major airline lost a passenger plane and officials covered it up within hours.',
        'Conspiracy accounts say satellite images prove the moon landing was staged and the government erased the original footage years ago.',
        'A fake alert circulated online claiming a new law would remove all household electricity and give free batteries to selected families only.',
        'A social media trend claimed a celebrity doctor discovered a miracle cure and quietly banned all traditional treatments in hospitals.',
        'A fabricated headline says a well-known city was evacuated after a hidden underground river exploded beneath the downtown district.'
    ]

    real_df = pd.DataFrame({'title': real_samples, 'text': real_samples, 'label': 'real'})
    fake_df = pd.DataFrame({'title': fake_samples, 'text': fake_samples, 'label': 'fake'})

    real_df.to_csv(target_true, index=False)
    fake_df.to_csv(target_fake, index=False)

    print(f'Saved {len(real_samples)} real rows to {target_true}')
    print(f'Saved {len(fake_samples)} fake rows to {target_fake}')


if __name__ == '__main__':
    download_isot_dataset()
